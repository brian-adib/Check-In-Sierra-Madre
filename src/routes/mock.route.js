import { Router } from 'express';
import { db } from '../db/client.js';

const router = Router();

// MOCK: BANK
// Simula al equipo del banco procesando un pago
router.post('/bank/charge', async (req, res) => {
  const { amount, document } = req.body;
  
  // Simulamos que el banco procesa la tarjeta del pasajero
  // Si el monto es mayor a 0, aprobamos el pago
  const isApproved = amount > 0;

  if (isApproved) {
    return res.status(200).json({
      success: true,
      message: 'Payment processed by bank',
      transactionId: `TXN-${Date.now()}`,
      amount
    });
  }

  return res.status(402).json({
    success: false,
    error: { code: 'ERR_PAYMENT_DECLINED', message: 'Bank declined the transaction' }
  });
});

// MOCK: CABIN
// Simula al equipo de cabinas validando disponibilidad
router.get('/cabin/availability/:cabinId', async (req, res) => {
  const { cabinId } = req.params;

  try {
    const result = await db.execute({
      sql: 'SELECT capacity, occupied FROM cabins WHERE id = ?',
      args: [cabinId]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'ERR_CABIN_NOT_FOUND', message: 'Cabin does not exist' }
      });
    }

    const cabin = result.rows[0];
    const available = cabin.occupied < cabin.capacity;

    return res.status(200).json({
      success: true,
      available,
      capacity: cabin.capacity,
      occupied: cabin.occupied
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'ERR_DB', message: 'Database error in Cabin Mock' }
    });
  }
});

export default router;