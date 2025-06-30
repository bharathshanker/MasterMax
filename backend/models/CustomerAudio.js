import mongoose from 'mongoose';

const CustomerAudioSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true, // The name multer saves it as
  },
  path: {
    type: String,
    required: true, // Path relative to the server where the file is stored
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  language: {
    type: String,
    required: true,
    trim: true,
    // Consider enum later if languages are fixed: enum: ['English', 'Hindi', 'Tamil']
  },
  product: {
    type: String,
    trim: true,
    default: 'General',
  },
  audioType: {
    type: String,
    required: true,
    trim: true,
    // Consider enum later: enum: ['Inquiry', 'Complaint', 'Follow-up', 'Sales Pitch']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
  },
  evaluationCriteria: { type: String, default: '' },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('CustomerAudio', CustomerAudioSchema);
