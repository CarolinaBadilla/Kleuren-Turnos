import pkg from 'pg';
const { Pool } = pkg;

let pool;

export async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL no está configurada');
  }
  
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  console.log('✅ Conectado a PostgreSQL (Supabase)');
  return pool;
}

export function getDb() {
  if (!pool) {
    throw new Error('Base de datos no inicializada');
  }
  return pool;
}