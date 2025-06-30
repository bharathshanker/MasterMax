import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String },
  profilePic: { type: String },
  practiceCount: { type: Number, default: 0 },
  fiveStarCount: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  lastPractice: { type: Date },
  topStrengths: [{ type: String }],
  improvementAreas: [{ type: String }],
  mostPracticedProduct: { type: String },
  streak: { type: Number, default: 0 },
  userId: { type: String, default: 'single-user', unique: true }, // Optional for single-user mode
}, { timestamps: true });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;
