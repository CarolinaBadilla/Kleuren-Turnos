import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

let db;

export async function initializeDatabase() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Crear tabla de usuarios
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('secretaria', 'manicurista')),
      full_name TEXT NOT NULL
    )
  `);

  // Crear tabla de turnos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      dni TEXT NOT NULL,
      service_type TEXT NOT NULL CHECK(service_type IN ('esmaltado', 'semipermanente', 'capping', 'pedicura', 'depilacion')),
      manicurist_id INTEGER NOT NULL,
      is_reserved INTEGER NOT NULL DEFAULT 0,
      duration INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('confirmado', 'pedido', 'cancelado')),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manicurist_id) REFERENCES users(id)
    )
  `);

  // Insertar usuarios de prueba si no existen
  const adminExists = await db.get('SELECT * FROM users WHERE username = "secretaria"');
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.run(
      'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
      ['secretaria', hashedPassword, 'secretaria', 'Secretaria Principal']
    );
  }

  const manicuristas = [
    { username: 'daniela', full_name: 'Daniela' },
    { username: 'paula', full_name: 'Paula' },
    { username: 'luana', full_name: 'Luana' }
  ];

  for (const m of manicuristas) {
    const exists = await db.get('SELECT * FROM users WHERE username = ?', [m.username]);
    if (!exists) {
      const hashedPassword = await bcrypt.hash('manicura123', 10);
      await db.run(
        'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
        [m.username, hashedPassword, 'manicurista', m.full_name]
      );
    }
  }

  return db;
}

export function getDb() {
  return db;
}