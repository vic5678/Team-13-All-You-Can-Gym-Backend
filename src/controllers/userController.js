import * as userService from '../services/userService.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from "../models/user.js";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';
import dotenv from 'dotenv';


dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
/**
 * @description Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const registerUser = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user already exists
        const userExists = await userService.findUserByEmail(email);
        if (userExists) {
            return errorResponse(res, 400, 'User with this email already exists.');
        }

        // Create user
        const user = await userService.createUser(req.body);

        if (user) {
            // Create token
            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
                expiresIn: '30d',
            });

            return successResponse(res, 201, 'User registered successfully', {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token,
            });
        } else {
            return errorResponse(res, 400, 'Invalid user data');
        }
    } catch (error) {
        return errorResponse(res, 500, 'Server error during registration', error.message);
    }
};

/**
 * @description Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const loginUser = async (req, res) => {
  try {
    // Frontend sends "username" even if it's an email -> treat as identifier
    const { email, password } = req.body; // our axios sends { email, password }
    const payload = await userService.loginUser(email, password);

    return successResponse(
      res,
      200,
      SUCCESS_MESSAGES.LOGIN_SUCCESS || "User logged in successfully",
      payload
    );
  } catch (err) {
    console.error("User login error:", err);
    return errorResponse(
      res,
      500,
      "Server error during login",
      err
    );
  }
};

/**
 * Search for user by username.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const searchUsersByName = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return errorResponse(res, 400, 'Username query parameter is required.');
        }
        const users = await userService.searchUsersByName(username);
        return successResponse(res, 200, SUCCESS_MESSAGES.USER_RETRIEVED, users);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserProfile = async (req, res) => {
    try {
        const requestedUserId = req.params.userId;
        const authenticatedUserId = req.user.id; // Provided by the 'authenticate' middleware

        const user = await userService.getUserById(requestedUserId);

        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        // Check if the requester is the user themselves
        if (authenticatedUserId === requestedUserId) {
            // Return the full profile for the owner
            return successResponse(res, 200, 'User profile retrieved successfully', user);
        } else {
            // Return a limited, public profile for other users
            const publicProfile = {
                _id: user._id,
                username: user.username,
            };
            return successResponse(res, 200, 'User profile retrieved successfully', publicProfile);
        }
    } catch (error) {
        return errorResponse(res, 500, 'Error retrieving user profile', error);
    }
};

/**
 * @description Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const updatedUser = await userService.updateUser(userId, req.body);

        if (!updatedUser) {
            return errorResponse(res, 404, 'User not found');
        }

        return successResponse(res, 200, { user: updatedUser }, 'User profile updated successfully');
    } catch (error) {
        return errorResponse(res, 500, 'Error updating user profile');
    }
};

// /**
//  * @description Send a friend request to another user
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  */
// export const sendFriendRequest = async (req, res) => {
//     try {
//         const { recipientId } = req.body;
//         const senderId = req.params.userId; // The user sending the request

//         const recipient = await userService.getUserById(recipientId);
//         const sender = await userService.getUserById(senderId);

//         if (!recipient || !sender) {
//             return errorResponse(res, 404, 'User not found');
//         }

//         // Check if already friends or request already sent
//         if (recipient.friends.includes(senderId) || recipient.friendRequests.some(req => req.from.equals(senderId))) {
//             return errorResponse(res, 400, 'Friend request already sent or already friends');
//         }

//         recipient.friendRequests.push({ from: senderId });
//         await recipient.save();

//         return successResponse(res, 200, null, 'Friend request sent successfully');
//     } catch (error) {
//         return errorResponse(res, 500, 'Error sending friend request', error.message);
//     }
// };

// /**
//  * @description Accept a friend request
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  */
// export const acceptFriendRequest = async (req, res) => {
//     try {
//         const { userId, requestId } = req.params; // userId is the acceptor, requestId is the sender

//         const acceptor = await userService.getUserById(userId);
//         const sender = await userService.getUserById(requestId);

//         if (!acceptor || !sender) {
//             return errorResponse(res, 404, 'User not found');
//         }

//         // Find and remove the request
//         const requestIndex = acceptor.friendRequests.findIndex(req => req.from.equals(requestId));
//         if (requestIndex === -1) {
//             return errorResponse(res, 404, 'Friend request not found');
//         }
//         acceptor.friendRequests.splice(requestIndex, 1);

//         // Add each other to friends lists
//         acceptor.friends.push(requestId);
//         sender.friends.push(userId);

//         await acceptor.save();
//         await sender.save();

//         return successResponse(res, 200, null, 'Friend request accepted');
//     } catch (error) {
//         return errorResponse(res, 500, 'Error accepting friend request', error.message);
//     }
// };

// /**
//  * @description Decline a friend request
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  */
// export const declineFriendRequest = async (req, res) => {
//     try {
//         const { userId, requestId } = req.params; // userId is the decliner, requestId is the sender

//         const decliner = await userService.getUserById(userId);
//         if (!decliner) {
//             return errorResponse(res, 404, 'User not found');
//         }

//         // Find and remove the request
//         const initialLength = decliner.friendRequests.length;
//         decliner.friendRequests = decliner.friendRequests.filter(req => !req.from.equals(requestId));

//         if (decliner.friendRequests.length === initialLength) {
//             return errorResponse(res, 404, 'Friend request not found');
//         }

//         await decliner.save();

//         return successResponse(res, 200, null, 'Friend request declined');
//     } catch (error) {
//         return errorResponse(res, 500, 'Error declining friend request', error.message);
//     }
// };

// /**
//  * @description Get a user's friends list
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  */
// export const getFriendsList = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const user = await userService.getUserById(userId, { path: 'friends', select: 'username email' });

//         if (!user) {
//             return errorResponse(res, 404, 'User not found');
//         }

//         return successResponse(res, 200, user.friends, 'Friends list retrieved successfully');
//     } catch (error) {
//         return errorResponse(res, 500, 'Error retrieving friends list', error.message);
//     }
// };

/**
 * @description Delete a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const deletedUser = await userService.deleteUserById(userId);

        if (!deletedUser) {
            return errorResponse(res, 404, 'User not found');
        }

        return successResponse(res, 200, 'User deleted successfully', null);
    } catch (error) {
        return errorResponse(res, 500, 'Error deleting user');
    }
};