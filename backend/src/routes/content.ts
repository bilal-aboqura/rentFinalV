import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getFaq, getAllContent } from '../controllers/content.js';

const router = Router();

router.get('/faq', asyncHandler(getFaq));
router.get('/', asyncHandler(getAllContent));

export default router;
