PRAGMA foreign_keys = ON;

CREATE TABLE check_in_groups (
  id          TEXT PRIMARY KEY,
  group_code  TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'PENDING'
              CHECK (status IN ('PENDING','CONFIRMED','CANCELLED')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE passengers (
  id              TEXT PRIMARY KEY,
  group_id        TEXT NOT NULL REFERENCES check_in_groups(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL CHECK (document_type IN ('DNI','PASSPORT','ID')),
  document_number TEXT NOT NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  birth_date      TEXT NOT NULL,
  is_vip          INTEGER NOT NULL DEFAULT 0 CHECK (is_vip IN (0,1)),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (document_type, document_number)
);

CREATE TABLE cabins (
  id           TEXT PRIMARY KEY,
  cabin_number TEXT NOT NULL UNIQUE,
  deck         INTEGER NOT NULL,
  capacity     INTEGER NOT NULL CHECK (capacity > 0),
  occupied     INTEGER NOT NULL DEFAULT 0 CHECK (occupied >= 0),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (occupied <= capacity)
);

CREATE TABLE check_ins (
  id           TEXT PRIMARY KEY,
  passenger_id TEXT NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
  cabin_id     TEXT REFERENCES cabins(id),
  status       TEXT NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','CANCELLED')),
  qr_payload   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE payments (
  id           TEXT PRIMARY KEY,
  check_in_id  TEXT NOT NULL UNIQUE REFERENCES check_ins(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency     TEXT NOT NULL DEFAULT 'USD',
  status       TEXT NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING','PAID','REFUNDED')),
  external_ref TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE luggage (
  id              TEXT PRIMARY KEY,
  check_in_id     TEXT NOT NULL UNIQUE REFERENCES check_ins(id) ON DELETE CASCADE,
  bag_count       INTEGER NOT NULL DEFAULT 0 CHECK (bag_count >= 0),
  total_weight_kg REAL    NOT NULL DEFAULT 0 CHECK (total_weight_kg >= 0),
  extra_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (extra_fee_cents >= 0),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE theater_seats (
  id          TEXT PRIMARY KEY,
  row_label   TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  is_blocked  INTEGER NOT NULL DEFAULT 0 CHECK (is_blocked IN (0,1)),
  UNIQUE (row_label, seat_number)
);

CREATE TABLE theater_reservations (
  id          TEXT PRIMARY KEY,
  check_in_id TEXT NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  seat_id     TEXT NOT NULL REFERENCES theater_seats(id),
  status      TEXT NOT NULL DEFAULT 'RESERVED'
              CHECK (status IN ('RESERVED','CANCELLED')),
  separated   INTEGER NOT NULL DEFAULT 0 CHECK (separated IN (0,1)),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_passengers_group         ON passengers(group_id);
CREATE INDEX idx_check_ins_passenger      ON check_ins(passenger_id);
CREATE INDEX idx_check_ins_cabin          ON check_ins(cabin_id);
CREATE INDEX idx_payments_check_in        ON payments(check_in_id);
CREATE INDEX idx_luggage_check_in         ON luggage(check_in_id);
CREATE INDEX idx_theater_res_check_in     ON theater_reservations(check_in_id);
CREATE UNIQUE INDEX uq_theater_seat_live
  ON theater_reservations(seat_id) WHERE status = 'RESERVED';