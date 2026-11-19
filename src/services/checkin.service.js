import { db } from '../db/client.js';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';

export const initiateCheckIn = async (data) => {
  const { groupCode } = data;
  const groupResult = await db.execute({ sql: 'SELECT id FROM check_in_groups WHERE group_code = ?', args: [groupCode] });
  if (groupResult.rows.length === 0) {
    const error = new Error('Reservation not found');
    error.code = 'ERR_RESERVATION_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }
  const groupId = groupResult.rows[0].id;
  const passengersResult = await db.execute({ sql: 'SELECT * FROM passengers WHERE group_id = ?', args: [groupId] });
  const passengers = passengersResult.rows;

  let hasAdult = false;
  let hasMinor = false;
  for (const pax of passengers) {
    const age = new Date().getFullYear() - new Date(pax.birth_date).getFullYear();
    if (age >= 18) hasAdult = true;
    if (age < 18) hasMinor = true;
  }
  if (hasMinor && !hasAdult) {
    const error = new Error('Minors require at least one adult.');
    error.code = 'ERR_AGE_REQUIREMENT';
    error.statusCode = 422;
    throw error;
  }

  const checkInIds = [];
  const tx = await db.transaction();
  try {
    for (const pax of passengers) {
      const existing = await tx.execute({ sql: 'SELECT id FROM check_ins WHERE passenger_id = ?', args: [pax.id] });
      let checkInId;
      if (existing.rows.length > 0) {
        checkInId = existing.rows[0].id;
      } else {
        checkInId = randomUUID();
        await tx.execute({ sql: `INSERT INTO check_ins (id, passenger_id, status) VALUES (?, ?, 'PENDING')`, args: [checkInId, pax.id] });
      }
      checkInIds.push(checkInId);
    }
    await tx.commit();
    return { groupId, checkInIds };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

// NUEVO: Enviar datos a Reservaciones
export const sendToReservations = async (checkInId) => {
  const url = 'http://localhost:3000/api/mock/reservations/confirm';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkInId, status: 'PENDING_CONFIRMATION' })
  });
  const data = await response.json();
  if (!data.success) {
    const error = new Error('Reservaciones rechazó el Check-in');
    error.code = 'ERR_RESERVATION_REJECTED';
    error.statusCode = 400;
    throw error;
  }
  return data;
};

export const processPayment = async (data) => {
  const { checkInId, amount, documentNumber } = data;
  const response = await fetch('http://localhost:3000/api/mock/bank/charge', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, document: documentNumber })
  });
  const result = await response.json();
  if (!result.success) {
    const error = new Error('Payment declined');
    error.code = 'ERR_PAYMENT_PENDING';
    error.statusCode = 402;
    throw error;
  }
  await db.execute({ sql: `INSERT INTO payments (id, check_in_id, amount_cents, status) VALUES (?, ?, ?, 'PAID')`, args: [randomUUID(), checkInId, amount * 100] });
  return { message: 'Payment processed successfully' };
};

export const assignCabin = async (data) => {
  const { checkInId, cabinId } = data;
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

export const getCabins = async () => {
  const result = await db.execute('SELECT id, cabin_number, deck, capacity, occupied FROM cabins');
  return result.rows;
};

export const generateQR = async (checkInId) => {
  const checkInResult = await db.execute({ sql: 'SELECT status, qr_payload FROM check_ins WHERE id = ?', args: [checkInId] });
  if (checkInResult.rows.length === 0) { const e = new Error('Check-in not found'); e.code = 'ERR_NOT_FOUND'; e.statusCode = 404; throw e; }
  const checkIn = checkInResult.rows[0];
  if (checkIn.status !== 'IN_PROGRESS' && checkIn.status !== 'COMPLETED') { const e = new Error('Check-in is not ready'); e.code = 'ERR_CHECKIN_INCOMPLETE'; e.statusCode = 400; throw e; }
  if (checkIn.qr_payload) return { qrBase64: checkIn.qr_payload };
  const payload = { checkInId, boarding: 'SIERRA-MADRE', timestamp: Date.now() };
  const qrBase64 = await QRCode.toDataURL(JSON.stringify(payload));
  await db.execute({ sql: 'UPDATE check_ins SET qr_payload = ? WHERE id = ?', args: [qrBase64, checkInId] });
  return { qrBase64 };
};

export const registerLuggage = async (data) => {
  const { checkInId, bagCount, totalWeightKg, isVip } = data;
  let extraFee = 0;
  if (!isVip) {
    const extraBags = Math.max(0, bagCount - 1);
    const extraWeight = Math.max(0, totalWeightKg - 20);
    extraFee = (extraBags * 10) + (extraWeight * 10); 
  }
  if (extraFee > 0) { const e = new Error('Luggage limit exceeded'); e.code = 'ERR_LUGGAGE_LIMIT'; e.statusCode = 422; throw e; }
  await db.execute({ sql: `INSERT INTO luggage (id, check_in_id, bag_count, total_weight_kg, extra_fee_cents) VALUES (?, ?, ?, ?, ?)`, args: [randomUUID(), checkInId, bagCount, totalWeightKg, extraFee * 100] });
  return { message: 'Luggage registered successfully', extraFee };
};

export const processCheckout = async (checkInId, documentNumber) => {
  const result = await db.execute({ sql: 'SELECT cabin_id FROM check_ins WHERE id = ?', args: [checkInId] });
  if (result.rows.length === 0 || !result.rows[0].cabin_id) { const e = new Error('Cabin not assigned'); e.code = 'ERR_NO_CABIN'; e.statusCode = 400; throw e; }
  const cabinId = result.rows[0].cabin_id;
  const cabinResponse = await fetch(`http://localhost:3000/api/mock/cabin/checkout-report/${cabinId}`);
  const cabinReport = await cabinResponse.json();
  let chargeMessage = 'Check-out successful. No extra charges.';
  if (cabinReport.hasCharges && cabinReport.amount > 0) {
    const bankResponse = await fetch('http://localhost:3000/api/mock/bank/charge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: cabinReport.amount, document: documentNumber })
    });
    const bankResult = await bankResponse.json();
    if (!bankResult.success) { const e = new Error('Extra charges declined'); e.code = 'ERR_PAYMENT_PENDING'; e.statusCode = 402; throw e; }
    await db.execute({ sql: `INSERT INTO payments (id, check_in_id, amount_cents, status) VALUES (?, ?, ?, 'PAID')`, args: [randomUUID(), checkInId, cabinReport.amount * 100] });
    chargeMessage = `Check-out successful. Extra charge of $${cabinReport.amount} processed for: ${cabinReport.reason}`;
  }
  await db.execute({ sql: "UPDATE check_ins SET status = 'COMPLETED' WHERE id = ?", args: [checkInId] });
  return { message: chargeMessage };
};