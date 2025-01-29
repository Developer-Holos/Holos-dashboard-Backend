const express = require('express');
const cors = require('cors');
const setupSwaggerDocs = require('./swagger');
const app = express();

// Configurar CORS con opciones adicionales
const corsOptions = {
  origin: 'http://localhost:4200', // Permitir solicitudes desde este origen
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos permitidos
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization', // Encabezados permitidos
  credentials: true, // Permitir el envío de cookies y encabezados de autorización
};

app.use(cors(corsOptions));

// Otros middlewares y configuraciones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar Swagger
setupSwaggerDocs(app);

// Rutas
const usersRoutes = require('./routes/usersRoutes');
const promptsRoutes = require('./routes/promptsRoutes');
const assistantsRoutes = require('./routes/assistantsRoutes');

app.use('/api/users', usersRoutes);
app.use('/api/prompts', promptsRoutes);
app.use('/api/assistants', assistantsRoutes);

module.exports = app;