import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { db } from '../src/db/client.js';

describe('Flujo E2E de Check-in API (PR11)', () => {
  let checkInId;

  beforeAll(async () => {
    // 1. Mockeamos global.fetch para simular las respuestas de los otros microservicios
    vi.stubGlobal('fetch', vi.fn((url) => {
      // Mock de Reservaciones (Nuevo ST05)
      if (url.includes('/api/mock/reservations/confirm')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, message: 'Check-in confirmado por Reservaciones' })
        });
      }
      // Mock de Cabinas
      if (url.includes('/api/mock/cabin/availability/')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, available: true })
        });
      }
      // Mock de Banco
      if (url.includes('/api/mock/bank/charge')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, transactionId: 'TEST-123' })
        });
      }
      return Promise.resolve({ json: () => Promise.resolve({}) });
    }));

    // Limpiamos la base de datos de test
    await db.execute("DELETE FROM check_ins WHERE id NOT IN (SELECT id FROM check_ins LIMIT 1)");
  });

  it('1. Debe iniciar el check-in de una reserva existente (ST01)', async () => {
    const res = await request(app)
      .post('/api/check-in/initiate')
      .send({ groupCode: 'FAM-001' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    checkInId = res.body.data.checkInIds[0];
  });

  it('2. Debe rechazar una reserva inexistente', async () => {
    const res = await request(app)
      .post('/api/check-in/initiate')
      .send({ groupCode: 'FAM-999' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe('ERR_RESERVATION_NOT_FOUND');
  });

  it('3. Debe enviar los datos a Reservaciones para confirmar el Check-in (ST05)', async () => {
    const res = await request(app)
      .post('/api/check-in/confirm-reservation')
      .send({ checkInId });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('Reservaciones');
  });

  it('4. Debe asignar una cabina correctamente (ST06)', async () => {
    // Obtenemos una cabina real de la base de datos
    const cabinsRes = await request(app).get('/api/check-in/cabins');
    const cabinId = cabinsRes.body.data[0].id;

    const res = await request(app)
      .post('/api/check-in/cabin')
      .send({ checkInId, cabinId });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('5. Debe generar el código QR en Base64 (SU02)', async () => {
    const res = await request(app).get(`/api/check-in/${checkInId}/qr`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.qrBase64).toContain('data:image/png;base64,');
  });
});