import express from 'express';
import {
  createSubscription,
  getUserSubscriptions,
  updateSubscription,
  cancelSubscription,
  getAllSubscriptionPackages,
  getSubscriptionPackageById
} from '../controllers/subscriptionController.js';

const router = express.Router();

//Route to get all subscriptionPackages
router.get('/subscriptionPackages', getAllSubscriptionPackages);

//Route to get a subscriptionPackage by ID
router.get('/subscriptionPackages/:id', getSubscriptionPackageById);

// Route to create a new subscription
router.post('/users/:userId/subscriptions', createSubscription);

// Route to get all subscriptions for a user
router.get('/users/:userId/subscriptions', getUserSubscriptions);

// Route to update a user's subscription
router.put('/users/:userId/subscriptions/:subscriptionId', updateSubscription);

// Route to cancel a user's subscription
router.delete('/users/:userId/subscriptions/:subscriptionId', cancelSubscription);

export default router;