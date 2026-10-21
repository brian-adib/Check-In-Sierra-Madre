import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Health Endpoint', () => {
  it('should return 200 and success true', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Service is healthy');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/ruta-inexistente');
    
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('ERR_NOT_FOUND');
  });
});