import { db } from '../db/client.js';
import { randomUUID } from 'crypto';

export const initiateCheckIn = async (data) => {
  const { groupCode, passengers } = data;
  let hasAdult = false;
  let hasMinor = false;

  for (const pax of passengers) {
    const age = new Date().getFullYear() - new Date(pax.birthDate).getFullYear();
    if (age >= 18) hasAdult = true;
    if (age < 18) hasMinor = true;
  }

  if (hasMinor && !hasAdult) {
    const error = new Error('Minors require at least one adult.');
    error.code = 'ERR_AGE_REQUIREMENT';
    error.statusCode = 422;
    throw error;
  }

  const groupId = randomUUID();
  const tx = await db.transaction();
  const checkInIds = [];

  try {
    await tx.execute({ sql: 'INSERT INTO check_in_groups (id, group_code) VALUES (?, ?)', args: [groupId, groupCode] });
    
    for (const pax of passengers) {
      const paxId = randomUUID();
      const checkInId = randomUUID();
      checkInIds.push(checkInId);

      await tx.execute({
        sql: `INSERT INTO passengers (id, group_id, document_type, document_number, first_name, last_name, birth_date, is_vip) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [paxId, groupId, pax.documentType, pax.documentNumber, pax.firstName, pax.lastName, pax.birthDate, pax.isVip ? 1 : 0]
      });

      // Create the check_in record linked to passenger
      await tx.execute({
        sql: `INSERT INTO check_ins (id, passenger_id, status) VALUES (?, ?, 'PENDING')`,
        args: [checkInId, paxId]
      });
    }
    await tx.commit();
    return { groupId, checkInIds };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

export const processPayment = async (data) => {
  const { checkInId, amount, documentNumber } = data;

  // Call internal Bank Mock
  const response = await fetch('http://localhost:3000/api/mock/bank/charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, document: documentNumber })
  });
  const result = await response.json();

  if (!result.success) {
    const error = new Error('Payment declined');
    error.code = 'ERR_PAYMENT_PENDING';
    error.statusCode = 402;
    throw error;
  }

  await db.execute({
    sql: `INSERT INTO payments (id, check_in_id, amount_cents, status) VALUES (?, ?, ?, 'PAID')`,
    args: [randomUUID(), checkInId, amount * 100]
  });
  
  return { message: 'Payment processed successfully' };
};

export const assignCabin = async (data) => {
  const { checkInId, cabinId } = data;

  // Call internal Cabin Mock
  const response = await fetch(`http://localhost:3000/api/mock/cabin/availability/${cabinId}`);
  const result = await response.json();

  if (!result.success || !result.available) {
    const error = new Error('Cabin is full or not found');
    error.code = 'ERR_CABIN_FULL';
    error.statusCode = 409;
    throw error;
  }

  const tx = await db.transaction();
  try {
    await tx.execute({ sql: 'UPDATE cabins SET occupied = occupied + 1 WHERE id = ?', args: [cabinId] });
    await tx.execute({ sql: `UPDATE check_ins SET cabin_id = ?, status = 'IN_PROGRESS' WHERE id = ?`, args: [cabinId, checkInId] });
    await tx.commit();
    return { message: 'Cabin assigned successfully' };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
import QRCode from 'qrcode';

export const generateQR = async (checkInId) => {
  // 1. Buscamos el check-in en la base de datos para ver su estado actual
  const checkInResult = await db.execute({
    sql: 'SELECT status, qr_payload FROM check_ins WHERE id = ?',
    args: [checkInId]
  });

  // Si no existe, lanzamos un error 404
  if (checkInResult.rows.length === 0) {
    const error = new Error('Check-in not found');
    error.code = 'ERR_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  const checkIn = checkInResult.rows[0];

  // 2. Regla de negocio: El pase de abordar solo se genera si ya está en progreso o completado
  if (checkIn.status !== 'IN_PROGRESS' && checkIn.status !== 'COMPLETED') {
    const error = new Error('Check-in is not ready for boarding pass');
    error.code = 'ERR_CHECKIN_INCOMPLETE';
    error.statusCode = 400;
    throw error;
  }

  // 3. Idempotencia: Si el QR ya fue generado antes, lo devolvemos de la DB sin gastar recursos
  if (checkIn.qr_payload) {
    return { qrBase64: checkIn.qr_payload };
  }

  // 4. Generación del QR: Creamos un string JSON con la info del pase y lo convertimos a imagen Base64
  const payload = { checkInId, boarding: 'SIERRA-MADRE', timestamp: Date.now() };
  const qrBase64 = await QRCode.toDataURL(JSON.stringify(payload));

  // 5. Guardamos el Base64 generado en la base de datos para futuras consultas
  await db.execute({
    sql: 'UPDATE check_ins SET qr_payload = ? WHERE id = ?',
    args: [qrBase64, checkInId]
  });

  return { qrBase64 };
};