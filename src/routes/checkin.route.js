import { Router } from 'express';
import { initiate, pay, cabin, qr, checkout } from '../controllers/checkin.controller.js';

const router = Router();

router.post('/initiate', initiate);
router.post('/pay', pay);
router.post('/cabin', cabin);
router.post('/checkout', checkout);
router.get('/:id/qr', qr);

export default router;