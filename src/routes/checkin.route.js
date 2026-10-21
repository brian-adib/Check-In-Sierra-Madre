import { Router } from 'express';
import { initiate, pay, cabin, qr, checkout, listCabins } from '../controllers/checkin.controller.js';

const router = Router();

router.post('/initiate', initiate);
router.post('/pay', pay);
router.post('/cabin', cabin);
router.post('/checkout', checkout);
router.get('/:id/qr', qr);
router.get('/cabins', listCabins); // <-- Nueva ruta (GET)

export default router;