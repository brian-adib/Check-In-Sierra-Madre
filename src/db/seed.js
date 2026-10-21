import { db } from './client.js';
import { logger } from '../config/logger.js';
import { randomUUID } from 'crypto';

async function seed() {
  try {
    logger.info('Starting database seeding...');

    const cabins = [
      { id: randomUUID(), number: 'A-101', deck: 1, capacity: 4 },
      { id: randomUUID(), number: 'A-102', deck: 1, capacity: 2 },
      { id: randomUUID(), number: 'B-201', deck: 2, capacity: 4 },
      { id: randomUUID(), number: 'SUITE-01', deck: 3, capacity: 6 },
    ];

    for (const cabin of cabins) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO cabins (id, cabin_number, deck, capacity) VALUES (?, ?, ?, ?)`,
        args: [cabin.id, cabin.number, cabin.deck, cabin.capacity],
      });
    }
    logger.info('Cabins seeded.');

    const rows = ['A', 'B'];
    for (const row of rows) {
      for (let i = 1; i <= 10; i++) {
        const seatId = randomUUID();
        await db.execute({
          sql: `INSERT OR IGNORE INTO theater_seats (id, row_label, seat_number) VALUES (?, ?, ?)`,
          args: [seatId, row, i],
        });
      }
    }
    logger.info('Theater seats seeded.');

    const groupId = 'demo-group-001';
    const groupCode = 'FAM-001';
    
    await db.execute({
      sql: `INSERT OR IGNORE INTO check_in_groups (id, group_code) VALUES (?, ?)`,
      args: [groupId, groupCode],
    });

    const passengers = [
      { id: randomUUID(), doc: '11111111', first: 'Ana', last: 'Perez', dob: '1985-03-10', vip: 1 },
      { id: randomUUID(), doc: '22222222', first: 'Leo', last: 'Perez', dob: '2015-07-22', vip: 0 },
    ];

    for (const pax of passengers) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO passengers (id, group_id, document_type, document_number, first_name, last_name, birth_date, is_vip) VALUES (?, ?, 'DNI', ?, ?, ?, ?, ?)`,
        args: [pax.id, groupId, pax.doc, pax.first, pax.last, pax.dob, pax.vip],
      });
    }
    logger.info('Demo group and passengers seeded.');

    logger.info('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();