// MongoDB model for Rubric
import mongoose from 'mongoose';

const qualitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  weight: { type: Number, default: 1 }
});

const rubricSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qualities: [qualitySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Rubric = mongoose.model('Rubric', rubricSchema);
export default Rubric;
