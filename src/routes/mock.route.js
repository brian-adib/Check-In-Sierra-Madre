import { Router } from 'express';
import { db } from '../db/client.js';

const router = Router();

// MOCK: BANK
router.post('/bank/charge', async (req, res) => {
  const { amount } = req.body;
  if (amount > 0) {
    return res.status(200).json({ success: true, message: 'Payment processed by bank', transactionId: `TXN-${Date.now()}`, amount });
  }
  return res.status(402).json({ success: false, error: { code: 'ERR_PAYMENT_DECLINED', message: 'Bank declined the transaction' } });
});

// MOCK: CABIN
router.get('/cabin/availability/:cabinId', async (req, res) => {
  const { cabinId } = req.params;
  try {
    const result = await db.execute({ sql: 'SELECT capacity, occupied FROM cabins WHERE id = ?', args: [cabinId] });
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { code: 'ERR_CABIN_NOT_FOUND', message: 'Cabin does not exist' } });
    const cabin = result.rows[0];
    return res.status(200).json({ success: true, available: cabin.occupied < cabin.capacity, capacity: cabin.capacity, occupied: cabin.occupied });
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'ERR_DB', message: 'Database error' } });
  }
});

// MOCK: CABIN CHECKOUT
router.get('/cabin/checkout-report/:cabinId', async (req, res) => {
  return res.status(200).json({ success: true, hasCharges: true, amount: 50, reason: 'Minibar consumption and broken glass' });
});

// MOCK: RESERVATIONS (NUEVO)
router.post('/reservations/confirm', async (req, res) => {
  const { checkInId, status } = req.body;
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulamos latencia de red
  return res.status(200).json({
    success: true,
    message: 'Check-in confirmado y validado por el equipo de Reservaciones',
    reservationId: 'FAM-001',
    timestamp: new Date().toISOString()
  });
});

export default router;