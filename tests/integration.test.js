import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { db } from '../src/db/client.js';

describe('Flujo E2E de Check-in API', () => {
  let checkInId;

  beforeAll(async () => {
    // 1. Mockeamos global.fetch para que no intente conectarse a localhost:3000
    vi.stubGlobal('fetch', vi.fn((url) => {
      // Simulamos la respuesta del Mock de Cabina
      if (url.includes('/api/mock/cabin/availability/')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, available: true })
        });
      }
      // Simulamos la respuesta del Mock del Banco
      if (url.includes('/api/mock/bank/charge')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, transactionId: 'TEST-123' })
        });
      }
      return Promise.resolve({ json: () => Promise.resolve({}) });
    }));

    await db.execute("DELETE FROM check_ins WHERE id NOT IN (SELECT id FROM check_ins LIMIT 1)");
  });

  it('1. Debe iniciar el check-in de una reserva existente', async () => {
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

  it('3. Debe asignar una cabina correctamente', async () => {
    const cabinsRes = await request(app).get('/api/check-in/cabins');
    const cabinId = cabinsRes.body.data[0].id;

    const res = await request(app)
      .post('/api/check-in/cabin')
      .send({ checkInId, cabinId });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('4. Debe generar el código QR en Base64', async () => {
    // Ahora que la cabina se asignó, el estado es IN_PROGRESS
    const res = await request(app).get(`/api/check-in/${checkInId}/qr`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.qrBase64).toContain('data:image/png;base64,');
  });
});