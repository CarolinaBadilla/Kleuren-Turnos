import pkg from 'pg';
const { Pool } = pkg;

const isProductionDocker = process.env.DATABASE_URL?.includes('kleuren-db');

let pool;

export async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL no está configurada');
  }
  
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: isProductionDocker ? false : { rejectUnauthorized: false },
    // Forzar conexión IPv4
    family: 4
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
