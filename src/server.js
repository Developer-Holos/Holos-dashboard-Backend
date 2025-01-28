require('dotenv').config();  // Cargar las variables de entorno

const app = require('./app');
const { syncDatabase } = require('./models');  // Importar syncDatabase

const PORT = process.env.PORT || 3000;  // Usar la variable de entorno o un valor predeterminado

// Sincronizar la base de datos
syncDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Error al sincronizar la base de datos:', error);
});