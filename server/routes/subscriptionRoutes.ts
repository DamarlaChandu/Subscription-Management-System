import express from 'express';
import {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  convertToQuotation,
  confirmSubscription,
  activateSubscription,
  suspendSubscription,
  closeSubscription
} from '../controllers/subscriptionController';
import { protect, authorizeRoles } from '../middleware/middleware';

const router = express.Router();

router.use(protect); // Protect all routes in this file

router.route('/')
  .post(authorizeRoles('admin', 'manager', 'user'), createSubscription)
  .get(getSubscriptions);

router.route('/:id')
  .get(getSubscriptionById)
  .put(authorizeRoles('admin', 'manager'), updateSubscription)
  .delete(authorizeRoles('admin'), deleteSubscription);

// Lifecycle Transitions
router.patch('/:id/quotation', authorizeRoles('admin', 'manager'), convertToQuotation);
router.patch('/:id/confirm', authorizeRoles('admin', 'manager'), confirmSubscription);
router.patch('/:id/activate', authorizeRoles('admin', 'manager'), activateSubscription);
router.patch('/:id/suspend', authorizeRoles('admin', 'manager'), suspendSubscription);
router.patch('/:id/close', authorizeRoles('admin', 'manager'), closeSubscription);

export default router;
