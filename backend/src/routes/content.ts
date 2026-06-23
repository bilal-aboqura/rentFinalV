import { Router } from 'express';
import { getPublicContent, getFaq } from '../controllers/content';

const router = Router();

router.get('/', getPublicContent);
router.get('/faq', getFaq);

export default router;
