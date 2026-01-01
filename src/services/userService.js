import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

/**
 * Find a user by their email.
 * @param {string} email - The email of the user to find.
 * @returns {Promise<User|null>}
 */
export const findUserByEmail = async (email) => {
    return User.findOne({ email });
};

/**
 * Create a new user after hashing their password.
 * @param {Object} userData - The data for the new user.
 * @returns {Promise<User>}
 */
export const createUser = async (userData) => {
    const { username, email, password, role } = userData;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
    });
    return user;
};

export const loginUser = async(email, password) => {
  try {
    // Frontend sends "username" even if it's an email -> treat as identifier
    if (!email || !password) {
      throw new Error("Email/username and password are required");
    }

    const identifier = email; // could be "user1" or "user1@example.com"

    // Look up by either email OR username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      throw new Error("Invalid email/username or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email/username or password");
    }

    console.log("JWT_SECRET used for user login:", JWT_SECRET);

    const token = jwt.sign(
      { id: user._id, role: "user" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: "user",
      token,
    };
} catch (error) {
    throw error;
}
}

/**
 * Search for user by username.
 * @param {string} keyword - The username to search for in user names.
 * @returns {Promise<Array>} - List of matching users.
 */
export const searchUsersByName = async (keyword) => {
    try {
        if (!keyword || keyword.trim() === '') {
            return [];
        }
        const query = {
            username: { $regex: keyword, $options: 'i' }
        };
        return await User.find(query).select('username _id');
    } catch (error) {
        throw new Error('Error searching users: ' + error.message);
    }
}

/**
 * Get a user by ID.
 * @param {string} userId - The ID of the user to retrieve.
 * @param {Object} [populateOptions=null] - Mongoose populate options.
 * @returns {Promise<User|null>}
 */
export const getUserById = async (userId, populateOptions = null) => {
    let query = User.findById(userId);
    if (populateOptions) {
        query = query.populate(populateOptions);
    }
    return query;
};

/**
 * Update a user by ID.
 * @param {string} userId - The ID of the user to update.
 * @param {Object} userData - The data to update the user with.
 * @returns {Promise<User|null>}
 */
export const updateUser = async (userId, userData) => {
    return User.findByIdAndUpdate(userId, userData, { new: true });
};

/**
 * Delete a user by ID.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<User|null>}
 */
export const deleteUserById = async (userId) => {
    return User.findByIdAndDelete(userId);
};