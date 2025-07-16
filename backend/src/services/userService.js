import User from '../../models/User.js'; // Use default export with ES modules

export const getUserByEmail = async (email) => {
  console.log("Fetching user by email:", email);
  return await User.findOne({ email }).select('-password'); // Use email, not _id
};

export const updateUserById = async (userId, updates) => {
  return await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true, runValidators: true }
  ).select('-password');
};
