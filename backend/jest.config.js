export default {
  // El entorno donde se ejecutarán los tests
  testEnvironment: 'node',
  
  // Extensiones de archivo
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // Directorio raíz
  rootDir: '.',
  
  // Patrones para encontrar archivos de test
  testMatch: ['**/tests/**/*.test.js'],
  
  // Archivos a ejecutar antes que los tests
  setupFilesAfterEnv: ['./tests/setup.js'],
  
  // Timeout global para todos los tests (30 segundos)
  testTimeout: 30000,
  
  // Transformar archivos .js (para ES modules)
  transform: {},
  
  // Ignorar node_modules
  transformIgnorePatterns: ['/node_modules/'],
  
  // Mostrar más detalles en los resultados
  verbose: true
};