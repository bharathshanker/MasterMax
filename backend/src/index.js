import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch';
import Rubric from './rubric.js';
import Product from './product.js';
import UserProfile from './user.js';
import CustomerAudio from '../models/CustomerAudio.js'; // Corrected path
// import CustomerCall from './models/CustomerCall.js'; // New model for admin-managed scenarios

// Setup
dotenv.config();
const GEMINI_RESPONSE_LOGGING = process.env.GEMINI_RESPONSE_LOGGING === 'true';
const app = express();
app.use(cors());
app.use(express.json());

// Calculate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Customer Audio Upload Configuration
const uploadDir = path.join(__dirname, '..', 'uploads', 'customer_audio');
fs.mkdirSync(uploadDir, { recursive: true });

const customerAudioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const audioFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an audio file!'), false);
  }
};

const customerAudioUpload = multer({ storage: customerAudioStorage, fileFilter: audioFileFilter });

// --- New Multer Configuration for Admin Uploaded Customer Call Scenarios ---
const adminCustomerCallAudioDir = path.join(__dirname, '..', 'uploads', 'customer_call_audio');
// Ensure directory exists (it was created by run_command, but good practice for code)
fs.mkdirSync(adminCustomerCallAudioDir, { recursive: true });

const adminCustomerCallAudioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, adminCustomerCallAudioDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_')); // Sanitize filename
  }
});

const adminCustomerCallAudioUpload = multer({ storage: adminCustomerCallAudioStorage, fileFilter: audioFileFilter });
// --- End New Multer Configuration ---

// Memory storage for evaluation uploads
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({ storage: memoryStorage, fileFilter: audioFileFilter });

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/pitch-expert', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Extended Pitch schema
const pitchSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  createdAt: { type: Date, default: Date.now },
  transcript: String,
  ratings: {},
  rationale: {},
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
});
const Pitch = mongoose.model('Pitch', pitchSchema);

// Get rubric for a specific product (or latest if not specified)
app.get('/api/rubric', async (req, res) => {
  const { productId } = req.query;
  let rubric;
  if (productId) {
    const product = await Product.findById(productId).populate('rubric');
    rubric = product && product.rubric;
  } else {
    rubric = await Rubric.findOne().sort({ updatedAt: -1 });
  }
  res.json(rubric);
});

// Update or create rubric (per product)
app.post('/api/rubric', async (req, res) => {
  const { rubricId, name, qualities } = req.body;
  let rubric;
  if (rubricId) {
    rubric = await Rubric.findById(rubricId);
    if (!rubric) return res.status(404).json({ error: 'Rubric not found' });
    rubric.name = name;
    rubric.qualities = qualities;
    rubric.updatedAt = new Date();
    await rubric.save();
  } else {
    rubric = await Rubric.create({ name, qualities });
  }
  res.json(rubric);
});

// Helper: Generate prompt from rubric
function generatePromptFromRubric(rubric) {
  // System prompt for Gemini: always check for empty/inaudible/ambient audio
  const systemPrompt = `IMPORTANT: If the audio is empty, silent, or contains only ambient noise and no clear human speech, respond with an error message: 'No valid pitch detected. The recording is empty or does not contain a clear voice.' Otherwise, proceed as instructed.`;

  if (!rubric || !rubric.qualities || rubric.qualities.length === 0) {
    return `${systemPrompt}\n\nTranscribe the following audio and provide a summary.`;
  }
  let prompt = `${systemPrompt}\n\nTranscribe the following audio, then rate the sales pitch on a scale of 1-5 for these qualities:`;
  rubric.qualities.forEach(q => {
    prompt += `\n- ${q.name}: ${q.description || ''}`;
  });
  prompt += `\n\nYou MUST return a single JSON object using EXACTLY these field names. Do not add, remove, or rename any fields. If you cannot rate a field, set its value to null.`;
  prompt += `\n\nReturn your response as a single JSON object with this structure:`;
  prompt += `\n{`;
  prompt += `\n  "transcript": "<transcript>",`;
  rubric.qualities.forEach(q => {
    prompt += `\n  "${q.name}": { "rating": <1-5|null>, "rationale": "<reason|null>" },`;
  });
  prompt += `\n  "cumulative": { "rating": <1-5|null>, "rationale": "<reason|null>" }`;
  prompt += `\n}`;
  return prompt;
}

// Upload endpoint
app.post('/api/pitch', upload.single('audio'), async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product is required' });
    const product = await Product.findById(productId).populate('rubric');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const rubric = product.rubric;
    if (!rubric) return res.status(404).json({ error: 'No rubric assigned to product' });
    const { file } = req;
    if (!file) return res.status(400).send('No file uploaded');

    const geminiPrompt = generatePromptFromRubric(rubric);

    // Log the prompt for debugging
    console.log('Prompt sent to Gemini:', geminiPrompt);
    try {
      // Also log to file
      fs.appendFileSync('gemini-prompts.log', `\n[${new Date().toISOString()}] Product: ${product.name} (${product._id})\nPrompt:\n${geminiPrompt}\n`);
    } catch (logErr) {
      console.error('Failed to write Gemini prompt to log:', logErr);
    }

    let ratings = {}, rationale = {}, transcript = '';
    try {
      console.log('Calling Gemini API for pitch analysis...');
      const apiKey = process.env.GEMINI_API_KEY;
      const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=' + apiKey;
      const audioBase64 = fs.readFileSync(file.path).toString('base64');
      const body = {
        contents: [{
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: file.mimetype,
                data: audioBase64
              }
            },
            { text: geminiPrompt }
          ]
        }]
      };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log('Gemini API call succeeded. Raw response:', JSON.stringify(data));
      // Log the raw Gemini response
      console.log('Gemini raw response:', JSON.stringify(data));
      if (GEMINI_RESPONSE_LOGGING) {
        try {
          const respLog = `\n[${new Date().toISOString()}] Product: ${product.name} (${product._id})\nGemini response:\n${JSON.stringify(data, null, 2)}\n`;
          fs.appendFileSync('gemini-responses.log', respLog);
        } catch (e) {
          console.error('Failed to write Gemini response to log:', e);
        }
      }
      if (!data.candidates || !data.candidates[0]?.content?.parts || !data.candidates[0].content.parts[0]?.text) {
        console.error('Unexpected Gemini API response:', JSON.stringify(data));
        return res.status(502).json({ error: 'Invalid Gemini response', geminiResponse: data });
      }
      const text = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
      transcript = parsed.transcript || '';
      ratings = {};
      rationale = {};
      if (rubric && rubric.qualities) {
        rubric.qualities.forEach(q => {
          const field = parsed[q.name];
          if (field) {
            ratings[q.name] = field.rating;
            rationale[q.name] = field.rationale;
          } else {
            // Log missing fields for debugging
            console.warn(`Gemini response missing field for quality: ${q.name}`);
          }
        });
      }
      if (parsed.cumulative) {
        ratings.cumulative = parsed.cumulative.rating;
        rationale.cumulative = parsed.cumulative.rationale;
      }
    } catch (err) {
      console.error('Gemini API call failed:', err);
      // fallback: leave ratings/rationale empty
    }

    const pitch = new Pitch({ filename: file.filename, originalname: file.originalname, transcript, ratings, rationale, product: product._id });
    await pitch.save();
    await updateUserProfileStats(pitch, product);
    res.json({ success: true, pitch });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all pitches
app.get('/api/pitches', async (req, res) => {
  const pitches = await Pitch.find().sort({ createdAt: -1 });
  res.json(pitches);
});

// Danger: Remove all pitches from the database
app.delete('/api/pitches', async (req, res) => {
  try {
    await Pitch.deleteMany({});
    res.json({ success: true, message: 'All pitches deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Product Endpoints ---
// Get all products (active & inactive) with full rubric
app.get('/api/products', async (req, res) => {
  const products = await Product.find().populate('rubric');
  res.json(products);
});

// Admin: Add or update a product and assign rubric
app.post('/api/products', async (req, res) => {
  try {
    const { name, rubricId, active } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required.' });
    }
    let product = await Product.findOne({ name });
    if (product) {
      product.rubric = rubricId;
      if (active !== undefined) product.active = active;
      product.updatedAt = new Date();
      await product.save();
    } else {
      product = await Product.create({ name, rubric: rubricId, active: active !== undefined ? active : true });
    }
    res.json(product);
  } catch (err) {
    console.error('Error in POST /api/products:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// List all rubrics (for product creation UI)
app.get('/api/rubric-list', async (req, res) => {
  try {
    const rubrics = await Rubric.find({}, '_id name');
    res.json(rubrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rubrics', details: err.message });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- API: Get user profile (single-user demo mode) ---
app.get('/api/user-profile', async (req, res) => {
  let userProfile = await UserProfile.findOne(); // Just get the first user profile
  if (!userProfile) {
    userProfile = new UserProfile({ name: 'New User', userId: 'single-user' });
    await userProfile.save();
  }
  res.json(userProfile);
});

// --- API: Update user profile (single-user demo mode) ---
app.post('/api/user-profile', async (req, res) => {
  const updates = req.body;
  let userProfile = await UserProfile.findOneAndUpdate({}, { ...updates, userId: 'single-user' }, { new: true, upsert: true });
  res.json(userProfile);
});

// --- Helper: Update user profile stats after pitch ---
async function updateUserProfileStats(pitch, product) {
  let userProfile = await UserProfile.findOne();
  if (!userProfile) {
    userProfile = new UserProfile({ name: 'New User', userId: 'single-user' });
  }
  userProfile.practiceCount = (userProfile.practiceCount || 0) + 1;
  if (pitch.ratings && pitch.ratings.cumulative === 5) {
    userProfile.fiveStarCount = (userProfile.fiveStarCount || 0) + 1;
  }
  // Average rating
  const allPitches = await Pitch.find();
  const ratings = allPitches.map(p => p.ratings?.cumulative || 0).filter(r => r > 0);
  userProfile.avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
  // Last practice
  userProfile.lastPractice = new Date();
  // Most practiced product (fix: use product ObjectId and populate names)
  const productCounts = {};
  const pitchesWithProducts = await Pitch.find().populate('product');
  pitchesWithProducts.forEach(p => {
    const prodName = p.product?.name || '';
    if (prodName) productCounts[prodName] = (productCounts[prodName] || 0) + 1;
  });
  if (product?.name) productCounts[product.name] = (productCounts[product.name] || 0) + 1;
  userProfile.mostPracticedProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  // Consistency streak (days)
  const days = pitchesWithProducts.map(p => new Date(p.createdAt).toDateString());
  days.push(new Date().toDateString()); // include today
  const uniqueDays = [...new Set(days)].sort();
  let streak = 1;
  for (let i = uniqueDays.length - 2; i >= 0; i--) {
    const d1 = new Date(uniqueDays[i]);
    const d2 = new Date(uniqueDays[i + 1]);
    if ((d2 - d1) / (1000 * 60 * 60 * 24) === 1) streak++;
    else break;
  }
  userProfile.streak = streak;
  // Top strengths & improvement areas (dummy for now)
  userProfile.topStrengths = ['Product mention', 'Speed'];
  userProfile.improvementAreas = ['Comparison', 'Example'];
  await userProfile.save();
}

// Customer Audio Upload Route
app.post('/api/admin/upload-customer-audio', customerAudioUpload.single('audio'), async (req, res) => {
  try {
    const { language, product, audioType, difficulty, evaluationCriteria } = req.body;

    if (!language || !audioType || !difficulty) {
      // Basic validation
      fs.unlinkSync(req.file.path); // Clean up uploaded file if validation fails
      return res.status(400).json({ message: 'Missing required tags: language, audioType, difficulty.' });
    }

    // Defensive: Warn if evaluationCriteria is missing
    if (!evaluationCriteria) {
      console.warn('No evaluationCriteria provided during upload.');
    }

    const newAudio = new CustomerAudio({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path, // Store the absolute path or relative path based on your needs
      mimetype: req.file.mimetype,
      size: req.file.size,
      language: language,
      product: product || 'General', // Default product if not provided
      audioType: audioType,
      difficulty: difficulty,
      evaluationCriteria: evaluationCriteria || '',
    });

    const savedAudio = await newAudio.save();

    res.status(201).json(savedAudio);

  } catch (error) {
    console.error('Error uploading customer audio:', error);
    // Clean up uploaded file if database save fails
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up uploaded file:', unlinkError);
      }
    }
    res.status(500).json({ message: 'Server error during audio upload.', error: error.message });
  }
});

// --- Get Random Customer Audio by Language ---
app.get('/api/customer-calls/random-audio', async (req, res) => {
  const { language } = req.query;
  console.log(`[Backend /random-audio] Received request for language: '${language}'`); // Log incoming language

  if (!language) {
    console.log('[Backend /random-audio] Language query parameter missing.');
    return res.status(400).json({ message: 'Language query parameter is required.' });
  }

  try {
    // Find call scenarios matching the language using the CustomerCall model
    // const matchingScenarios = await CustomerCall.find({ language: language });
    const matchingScenarios = []; // Temp fix: return empty array
    console.log(`[Backend /random-audio] Found ${matchingScenarios.length} scenarios for language '${language}':`, matchingScenarios); // Log query results

    if (!matchingScenarios || matchingScenarios.length === 0) {
      console.log(`[Backend /random-audio] No scenarios found for language '${language}'.`);
      return res.status(404).json({ message: `No audio files found for language: ${language}` });
    }

    // Select a random scenario from the matches
    const randomIndex = Math.floor(Math.random() * matchingScenarios.length);
    const randomScenario = matchingScenarios[randomIndex];

    // The audioFilePath should be the direct relative path like 'uploads/filename.mp3'
    // Ensure it starts with a '/' if it's meant to be an absolute path from the domain root
    const audioUrlPath = randomScenario.audioFilePath.startsWith('/') 
                         ? randomScenario.audioFilePath 
                         : `/${randomScenario.audioFilePath}`;

    res.json({ audioUrl: audioUrlPath, audioId: randomScenario._id, evaluationCriteria: randomScenario.evaluationCriteria });

  } catch (error) {
    console.error('Error fetching random customer call scenario:', error);
    res.status(500).json({ message: 'Server error while fetching audio scenario.', error: error.message });
  }
});

// --- Evaluate customer response based on criteria ---
app.post('/api/customer-calls/evaluate', memoryUpload.single('audio'), async (req, res) => {
  const { audioId } = req.body;
  if (!audioId || !req.file) {
    return res.status(400).json({ message: 'audioId and audio file are required.' });
  }
  try {
    // const original = await CustomerCall.findById(audioId); // Corrected: Use CustomerCall model
    const original = null; // Temp fix
    if (!original) {
      return res.status(404).json({ message: 'Original audio not found.' });
    }
    // Defensive: Use a fallback if evaluationCriteria is missing
    const criteriaForPrompt = original.evaluationCriteria && original.evaluationCriteria.trim().length > 0 ? original.evaluationCriteria : 'No specific evaluation criteria provided.';
    if (!original.evaluationCriteria || original.evaluationCriteria.trim().length === 0) {
      console.warn(`CustomerAudio ${original._id} is missing evaluationCriteria. Using fallback in prompt.`);
    }
    const prompt = `IMPORTANT: DO NOT INCLUDE A TRANSCRIPT OR ANY SECTION LABELED 'TRANSCRIPTION' OR SIMILAR. DO NOT RETURN ANYTHING EXCEPT THE JSON OBJECT BELOW.\n\nYou are an expert sales trainer evaluating a sales call response in audio format.\n\nInstructions:\n1. DO NOT include a transcript or any text outside the JSON object.\n2. Address the user respectfully and directly, as if giving feedback to them. Use polite, encouraging, and constructive language.\n3. Section 1: Evaluation of Delivery (Qualitative)\n    - Evaluate the delivery of the response on enthusiasm, clarity, confidence, naturalness, and engagement.\n    - Write a qualitative commentary in a mix of ${original.language} and English (do NOT provide English translations in brackets).\n    - Be specific, critical, and constructive.\n    - Provide a single overall rating for delivery, out of 5, as \"delivery_rating\".\n    - Example:\n      \"delivery_evaluation\": {\n        \"commentary\": \"Nalla try pannirkeenga! Clarity irundhuchu, but enthusiasm konjam korachal. Engagement was decent.\",\n        \"delivery_rating\": 4\n      }\n4. Section 2: Evaluation of Content (Objective, Based on Criteria)\n    - Refer to the following evaluation criteria: ${criteriaForPrompt}.\n    - List as bullet points (in ${original.language} and English mix) whether each required point was covered by the user.\n    - Be direct and critical, but polite.\n    - Give a separate rating for content, out of 5, as \"content_rating\".\n    - Example:\n      \"content_evaluation\": {\n        \"bullets\": [\n          \"Product mention irundhuchu.\",\n          \"Comparison point miss pannitanga.\",\n          \"Interest rate detail solradhula clarity korachal.\"\n        ],\n        \"content_rating\": 3\n      }\n5. OUTPUT: You MUST return ONLY a single JSON object with exactly these two sections: \"delivery_evaluation\" and \"content_evaluation\". Do NOT include any transcript, explanation, or commentary outside the JSON object. If you cannot rate a section, set its value to null.\n\nREMEMBER: DO NOT INCLUDE A TRANSCRIPT OR ANY TEXT OUTSIDE THE JSON OBJECT.`;

    // Log prompt for Customer Calls separately with error handling
    try {
      const ccPromptLog = `\n[${new Date().toISOString()}] CustomerCalls AudioId: ${original._id}\nPrompt:\n${prompt}\n`;
      fs.appendFileSync('customer-calls-prompts.log', ccPromptLog);
    } catch (logError) {
      console.error(`!!! Failed to write to customer-calls-prompts.log for AudioId ${original._id}:`, logError);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKey}`;
    const userAudioBase64 = req.file.buffer.toString('base64');
    const body = {
      contents: [{ role: 'user', parts: [
        { inline_data: { mime_type: req.file.mimetype, data: userAudioBase64 } },
        { text: prompt }
      ] }]
    };
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return res.status(502).json({ message: 'Invalid Gemini response structure', data });
    }
    const text = data.candidates[0].content.parts[0].text;
    console.log('Raw text from Gemini:', text); // Log the raw text

    // Log response for Customer Calls separately with error handling
    try {
      const ccRespLog = `\n[${new Date().toISOString()}] CustomerCalls AudioId: ${original._id}\nGemini response:\n${JSON.stringify(data, null, 2)}\n`;
      fs.appendFileSync('customer-calls-responses.log', ccRespLog);
    } catch (logError) {
      console.error(`!!! Failed to write to customer-calls-responses.log for AudioId ${original._id}:`, logError);
    }

    // Try to extract JSON safely
    const match = text.match(/\{[\s\S]*\}/);
    if (!match || !match[0]) {
      console.error('Could not find JSON object in Gemini response:', text);
      // Return the raw text as feedback if no JSON is found
      return res.json({ feedback: text });
    }

    try {
      const json = JSON.parse(match[0]);
      res.json(json);
    } catch (parseError) {
      console.error('Error parsing JSON from Gemini response:', parseError, 'Raw text:', match[0]);
      // If JSON parsing fails, return the raw text as feedback
      return res.json({ feedback: match[0] });
    }
  } catch (err) {
    console.error('Error evaluating response:', err);
    res.status(500).json({ message: 'Server error during evaluation.', error: err.message });
  }
});

// --- Danger: Remove all customer call recordings (admin only) ---
app.delete('/api/customer-calls/delete-all', async (req, res) => {
  try {
    const result = await CustomerAudio.deleteMany({});
    res.json({ success: true, message: `Deleted ${result.deletedCount} customer call recordings.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Admin Endpoints for Managing Customer Call Scenarios ---

// GET all customer call scenarios for admin
app.get('/api/admin/customer-calls', async (req, res) => {
  try {
    // const customerCalls = await CustomerCall.find().sort({ createdAt: -1 });
    const customerCalls = []; // Temp fix
    res.json(customerCalls);
  } catch (err) {
    console.error('Error fetching admin customer calls:', err);
    res.status(500).json({ error: 'Failed to retrieve customer call scenarios.' });
  }
});

// POST a new customer call scenario by admin
app.post('/api/admin/customer-calls', adminCustomerCallAudioUpload.single('audioFile'), async (req, res) => {
  try {
    const { language, cxTouchPoint, productName, enquiryType, difficultyLevel, evaluationCriteria } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required.' });
    }
    if (!language || !cxTouchPoint || !productName || !enquiryType || !difficultyLevel || !evaluationCriteria) {
      return res.status(400).json({ error: 'Language, Cx touch point, Product Name, Enquiry Type, Difficulty Level, and Evaluation Criteria are required.' });
    }

    /*
    const newCustomerCall = new CustomerCall({
      language,
      cxTouchPoint,
      productName, 
      enquiryType, 
      difficultyLevel, 
      evaluationCriteria, 
      originalAudioName: req.file.originalname,
      audioFileName: req.file.filename, 
      audioFilePath: `uploads/customer_call_audio/${req.file.filename}`,
    });

    await newCustomerCall.save();
    res.status(201).json(newCustomerCall);
    */
   res.status(501).json({error: "Temporarily disabled"});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// --- End Admin Endpoints for Customer Call Scenarios ---

// Endpoint to clear all recordings and database entries
app.post('/api/admin/clear-all-recordings', async (req, res) => {
  console.log('Attempting to clear all recordings and database entries...');
  try {
    // Delete all CustomerCall documents
    // const ccDeleteResult = await CustomerCall.deleteMany({});
    // console.log(`Deleted ${ccDeleteResult.deletedCount} documents from CustomerCall collection.`);
    const ccDeleteResult = { deletedCount: 0 }; // Temp fix

    // Delete all CustomerAudio documents
    const caDeleteResult = await CustomerAudio.deleteMany({});
    console.log(`Deleted ${caDeleteResult.deletedCount} documents from CustomerAudio collection.`);

    // Delete files from uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = await fs.promises.readdir(uploadsDir);
      let deletedFilesCount = 0;
      for (const file of files) {
        // Avoid deleting .gitkeep or other essential hidden files if any
        if (file.startsWith('.')) continue;
        try {
          await fs.promises.unlink(path.join(uploadsDir, file));
          deletedFilesCount++;
        } catch (fileErr) {
          console.error(`Error deleting file ${file}:`, fileErr.message);
          // Continue to delete other files
        }
      }
      console.log(`Deleted ${deletedFilesCount} files from ${uploadsDir}.`);
    } else {
      console.log(`Uploads directory ${uploadsDir} not found or already empty.`);
    }

    res.status(200).json({
      message: 'Successfully cleared all recordings and database entries.',
      customerCallDocsDeleted: ccDeleteResult.deletedCount,
      customerAudioDocsDeleted: caDeleteResult.deletedCount,
      // filesDeleted: deletedFilesCount (cannot access here due to scope, log is sufficient)
    });
  } catch (error) {
    console.error('Error clearing recordings:', error);
    res.status(500).json({ message: 'Failed to clear recordings.', error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
