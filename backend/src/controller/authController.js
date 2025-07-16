import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { JWT_SECRET } from '../config.js';

export const signup = async (req, res) => {
  try {
    console.log("🔥 Signup request body:", req.body);
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠️ User already exists:", existingUser);
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });
    // Issue JWT on signup for immediate login
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '2d' });
    res.status(201).json({ token, role: user.role });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ message: 'Signup failed' });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.isBlocked) {
        return res.status(403).json({ message: 'User is blocked' });
    }
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '2d' });

    res.status(200).json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signin failed' });
  }
};
