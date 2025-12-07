import express from 'express';
import {
    registerUser,
    loginUser,
    searchUsersByName,
    getUserProfile,
    updateUserProfile,
    // sendFriendRequest,
    // acceptFriendRequest,
    // declineFriendRequest,
    // getFriendsList,
    deleteUser
} from '../controllers/userController.js';
import {
    createSubscription,
    getUserSubscriptions,
    updateSubscription,
    cancelSubscription
} from '../controllers/subscriptionController.js';
import {
    bookUserIntoSession,
    unbookUserFromSession,
    getUserBookedSessions
} from '../controllers/sessionController.js';
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

// Delete user - only the user can delete their own account
router.delete('/:userId', [authenticate, authorizeSelf], deleteUser);

// Subscription management routes
// Route to create a new subscription
router.post('/:userId/subscription', authenticate, authorizeSelf, createSubscription);

// Route to get all subscriptions for a user
router.get('/:userId/subscription', authenticate, authorizeSelf, getUserSubscriptions);

// Route to update a user's subscription
router.put('/:userId/subscription/:subscriptionId', authenticate, authorizeSelf, updateSubscription);

// Route to cancel a user's subscription
router.delete('/:userId/subscription/:subscriptionId', authenticate, authorizeSelf, cancelSubscription);

// Session booking routes
// Route to book a user into a session
router.post('/:userId/sessions', authenticate, bookUserIntoSession);

// Route to unbook a user from a session
router.delete('/:userId/sessions/:sessionId', authenticate, unbookUserFromSession);

// Route to get all sessions a user is booked into
router.get('/:userId/sessions', authenticate, getUserBookedSessions);

// // Friend management routes
// // Send friend request - the sender must be the authenticated user
// router.post('/:userId/friends', [authenticate, authorizeSelf], sendFriendRequest);

// // Accept friend request - the acceptor must be the authenticated user
// router.put('/:userId/friends/:requestId', [authenticate, authorizeSelf], acceptFriendRequest);

// // Decline friend request - the decliner must be the authenticated user
// router.delete('/:userId/friends/:requestId', [authenticate, authorizeSelf], declineFriendRequest);

// // Get friends list - only the user can see their own friends
// router.get('/:userId/friends', [authenticate, authorizeSelf], getFriendsList);




//




export default router;