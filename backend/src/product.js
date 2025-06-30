// MongoDB model for Product
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  rubric: { type: mongoose.Schema.Types.ObjectId, ref: 'Rubric', required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
export default Product;
