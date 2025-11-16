import express from 'express';
import {
  getAllSubscriptionPackages,
  getSubscriptionPackageById
} from '../controllers/subscriptionController.js';

const router = express.Router();

//Route to get all subscriptionPackages
router.get('/', getAllSubscriptionPackages);

//Route to get a subscriptionPackage by ID
router.get('/:id', getSubscriptionPackageById);

export default router;