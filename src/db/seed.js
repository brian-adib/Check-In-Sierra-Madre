import { db } from './client.js';
import { logger } from '../config/logger.js';
import { randomUUID } from 'crypto';

async function seed() {
  try {
    logger.info('Starting database seeding...');

    // 1. Limpiar base de datos (opcional, para reiniciar pruebas)
    // await db.executeMultiple("DELETE FROM passengers; DELETE FROM check_in_groups; DELETE FROM cabins;");

    // 2. Cabinas
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

    // 3. Reservaciones y Pasajeros (FAM-001 a FAM-010)
    const groupsData = [
      { code: 'FAM-001', pax: [{ doc: '11111111', first: 'Ana', last: 'Perez', dob: '1985-03-10' }, { doc: '22222222', first: 'Leo', last: 'Perez', dob: '2015-07-22' }] },
      { code: 'FAM-002', pax: [{ doc: 'PAS-771203', first: 'Carlos', last: 'Mendoza', dob: '1970-05-15' }, { doc: 'PAS-771204', first: 'Patricia', last: 'Guzman', dob: '1975-08-20' }, { doc: 'PAS-771205', first: 'Sofia', last: 'Mendoza', dob: '2006-11-10' }] },
      { code: 'FAM-003', pax: [{ doc: 'US-998877', first: 'John', last: 'Doe', dob: '1978-01-01' }, { doc: 'US-998878', first: 'Jane', last: 'Doe', dob: '1980-02-02' }] },
      { code: 'FAM-004', pax: [{ doc: 'PAS-334481', first: 'Roberto', last: 'Jimenez', dob: '1982-09-12' }, { doc: 'PAS-334482', first: 'Laura', last: 'Martinez', dob: '1984-10-25' }, { doc: 'PAS-334483', first: 'Emilio', last: 'Jimenez', dob: '2013-04-05' }] },
      { code: 'FAM-005', pax: [{ doc: 'PAS-119905', first: 'Lucas', last: 'Vega', dob: '2010-12-01' }, { doc: 'PAS-119906', first: 'Mateo', last: 'Vega', dob: '2014-06-15' }] }, // Menores solos
      { code: 'FAM-006', pax: [{ doc: 'PAS-556621', first: 'Ricardo', last: 'Flores', dob: '1995-03-22' }] },
      { code: 'FAM-007', pax: [{ doc: 'PAS-882211', first: 'Elena', last: 'Ramos', dob: '1992-07-30' }, { doc: 'PAS-882212', first: 'Pedro', last: 'Ramos', dob: '1990-01-15' }, { doc: 'PAS-882213', first: 'Luis', last: 'Ramos', dob: '2018-09-10' }] },
      { code: 'FAM-008', pax: [{ doc: 'PAS-443322', first: 'Marta', last: 'Sanchez', dob: '1963-04-18' }, { doc: 'PAS-443323', first: 'Jorge', last: 'Sanchez', dob: '1961-11-05' }] },
      { code: 'FAM-009', pax: [{ doc: 'PAS-112233', first: 'Sofia', last: 'Castro', dob: '1998-06-25' }, { doc: 'PAS-112234', first: 'Diego', last: 'Castro', dob: '1996-12-12' }] },
      { code: 'FAM-010', pax: [{ doc: 'PAS-998877', first: 'Fernando', last: 'Vega', dob: '1981-02-28' }, { doc: 'PAS-998878', first: 'Alejandra', last: 'Rios', dob: '1983-05-14' }, { doc: 'PAS-998879', first: 'Mateo', last: 'Vega', dob: '2011-08-08' }] }
    ];

    for (const group of groupsData) {
      const groupId = randomUUID();
      await db.execute({
        sql: `INSERT OR IGNORE INTO check_in_groups (id, group_code) VALUES (?, ?)`,
        args: [groupId, group.code],
      });

      for (const p of group.pax) {
        await db.execute({
          sql: `INSERT OR IGNORE INTO passengers (id, group_id, document_type, document_number, first_name, last_name, birth_date, is_vip) VALUES (?, ?, 'PASSPORT', ?, ?, ?, ?, 0)`,
          args: [randomUUID(), groupId, p.doc, p.first, p.last, p.dob],
        });
      }
    }

    logger.info('Database seeding completed successfully. 10 groups added.');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();