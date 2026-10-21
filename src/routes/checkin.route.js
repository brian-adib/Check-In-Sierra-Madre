import { Router } from 'express';
// Importamos los controladores que acabamos de crear/actualizar
import { initiate, pay, cabin, qr } from '../controllers/checkin.controller.js';

// Inicializamos el enrutador de Express
const router = Router();

// ==========================================
// RUTAS DEL FLUJO DE CHECK-IN
// ==========================================

// 1. Iniciar el proceso (Validar edades, crear grupo y pasajeros)
router.post('/initiate', initiate);

// 2. Procesar el pago (Comunicarse con el Mock del Banco)
router.post('/pay', pay);

// 3. Asignar cabina (Comunicarse con el Mock de Cabinas)
router.post('/cabin', cabin);

// 4. Obtener el pase QR (Usa GET porque es una consulta de lectura)
// El ':id' es un parámetro dinámico que representará el ID del check-in
router.get('/:id/qr', qr);

// Exportamos el enrutador para que app.js pueda usarlo
export default router;