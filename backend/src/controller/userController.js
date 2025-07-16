import * as userService from '../services/userService.js';

export const getUserProfile = async (req, res) => {
  try {
    // req.user is set by JWT middleware
    console.log("Fetching user profile for user:", req.user);
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ message: 'email not found in token' });
    }
    console.log("Fetching user profile for email:", email);
    const profile = await userService.getUserByEmail(email);
    res.json(profile);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    const updates = req.body;
    const updatedProfile = await userService.updateUserById(userId, updates);
    res.json(updatedProfile);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: 'Failed to update user profile' });
  }
};
