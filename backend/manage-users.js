import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  console.log('\n=== GESTIÓN DE USUARIOS ===');
  console.log('1. Ver todos los usuarios');
  console.log('2. Crear nueva manicurista');
  console.log('3. Cambiar contraseña');
  console.log('4. Eliminar manicurista');
  console.log('5. Salir');
  
  const opcion = await question('\nElegí una opción: ');
  
  if (opcion === '1') {
    const users = await db.all('SELECT id, username, full_name, role FROM users');
    console.table(users);
  }
  
  else if (opcion === '2') {
    const username = await question('Usuario: ');
    const password = await question('Contraseña: ');
    const full_name = await question('Nombre completo: ');
    
    const hash = await bcrypt.hash(password, 10);
    await db.run(
      'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
      [username, hash, 'manicurista', full_name]
    );
    console.log('✅ Manicurista creada');
  }
  
  else if (opcion === '3') {
    const username = await question('Usuario: ');
    const newPassword = await question('Nueva contraseña: ');
    
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await db.run('UPDATE users SET password = ? WHERE username = ?', [hash, username]);
    
    if (result.changes > 0) {
      console.log('✅ Contraseña actualizada');
    } else {
      console.log('❌ Usuario no encontrado');
    }
  }
  
  else if (opcion === '4') {
    const username = await question('Usuario a eliminar: ');
    const user = await db.get('SELECT role FROM users WHERE username = ?', [username]);
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
    } else if (user.role === 'secretaria') {
      console.log('❌ No se puede eliminar la secretaria');
    } else {
      await db.run('DELETE FROM users WHERE username = ?', [username]);
      console.log('✅ Usuario eliminado');
    }
  }
  
  else if (opcion === '5') {
    console.log('👋 Chau');
  }
  
  await db.close();
  rl.close();
}

main();