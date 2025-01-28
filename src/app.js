const express = require('express');
const assistantsRoutes = require('./routes/assistantsRoutes');
const promptsRoutes = require('./routes/promptsRoutes');
const userRoutes = require('./routes/usersRoutes');
const setupSwaggerDocs = require('./swagger'); // Importar configuración de Swagger

const app = express();

// Middleware para JSON
app.use(express.json());

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/assistants', assistantsRoutes);
app.use('/api/prompts', promptsRoutes);

// Configurar Swagger
setupSwaggerDocs(app);

module.exports = app;