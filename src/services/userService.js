import User from '../models/user.js';
import bcrypt from 'bcryptjs';

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