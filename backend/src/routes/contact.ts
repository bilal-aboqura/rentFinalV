import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { submitContact } from '../controllers/contact.js';

const router = Router();

router.post('/', asyncHandler(submitContact));

export default router;
