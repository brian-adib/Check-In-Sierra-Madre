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