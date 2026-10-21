import { Router } from 'express';
// Añade 'luggage' al import
import { initiate, pay, cabin, qr, checkout, listCabins, luggage } from '../controllers/checkin.controller.js'; 

const router = Router();

router.post('/initiate', initiate);
router.post('/pay', pay);
router.post('/cabin', cabin);
router.post('/checkout', checkout);
router.get('/:id/qr', qr);
router.get('/cabins', listCabins);
router.post('/luggage', luggage); // <-- Nueva ruta

export default router;