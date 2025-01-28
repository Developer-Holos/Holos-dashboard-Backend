// server.js

require('dotenv').config();  // Cargar las variables de entorno

const app = require('./app');

const PORT = process.env.PORT || 3000;  // Usar la variable de entorno o un valor predeterminado

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
