const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config(); // Cargar las variables de entorno

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Assistant Management API',
      version: '1.0.0',
      description: 'API para administrar asistentes de OpenAI',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000/api', // URL base de tu API desde variables de entorno
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Ruta a los archivos donde están tus endpoints
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const setupSwaggerDocs = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger docs disponibles en ${process.env.API_BASE_URL}/api-docs`);
};

module.exports = setupSwaggerDocs;