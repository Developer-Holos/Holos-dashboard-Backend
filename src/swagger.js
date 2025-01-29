// filepath: /c:/Users/JOSE/Documents/GitHub/Holos-dashboard-Backend/src/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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
        url: 'http://localhost:3000/api', // URL base de tu API
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Ruta a los archivos donde están tus endpoints
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const setupSwaggerDocs = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger docs disponibles en http://localhost:3000/api-docs');
};

module.exports = setupSwaggerDocs;