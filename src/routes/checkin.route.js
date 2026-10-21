import { Router } from 'express';
import { initiate, pay, cabin } from '../controllers/checkin.controller.js';

const router = Router();

router.post('/initiate', initiate);
router.post('/pay', pay);
router.post('/cabin', cabin);

export default router;