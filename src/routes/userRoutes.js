import express from 'express';
import {
    registerUser,
    loginUser,
    searchUsersByName,
    getUserProfile,
    updateUserProfile,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getFriendsList,
    deleteUser
} from '../controllers/userController.js';
import { validateUserRegistration } from '../middleware/validation.js';
import { authenticate, authorizeSelf } from '../middleware/auth.js';

const router = express.Router();

// User registration with validation
router.post('/register', validateUserRegistration, registerUser);

// User login
router.post('/login', loginUser);

// Route to search users by name
router.get('/search', authenticate, searchUsersByName);

// Get user profile - can be public or protected. If protected:
router.get('/:userId', authenticate, getUserProfile);

// Update user profile - only the user themselves can update
router.put('/:userId', [authenticate, authorizeSelf], updateUserProfile);

// Send friend request - the sender must be the authenticated user
router.post('/:userId/friends', [authenticate, authorizeSelf], sendFriendRequest);

// Accept friend request - the acceptor must be the authenticated user
router.put('/:userId/friends/:requestId', [authenticate, authorizeSelf], acceptFriendRequest);

// Decline friend request - the decliner must be the authenticated user
router.delete('/:userId/friends/:requestId', [authenticate, authorizeSelf], declineFriendRequest);

// Get friends list - only the user can see their own friends
router.get('/:userId/friends', [authenticate, authorizeSelf], getFriendsList);

// Delete user - only the user can delete their own account
router.delete('/:userId', [authenticate, authorizeSelf], deleteUser);

export default router;