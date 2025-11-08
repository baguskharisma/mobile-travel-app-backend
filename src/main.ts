import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Request logging middleware - BEFORE any other middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    logger.log(`[${timestamp}] Incoming Request: ${req.method} ${req.url}`);
    logger.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
    logger.log(`Content-Type: ${req.headers['content-type']}`);
    next();
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Mobile Travel App API')
    .setDescription('Comprehensive REST API for Mobile Travel App Backend System')
    .setVersion('1.0')
    .setContact(
      'API Support',
      'https://github.com',
      'support@travelapp.com'
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Admins', 'Admin management endpoints')
    .addTag('Customers', 'Customer management endpoints')
    .addTag('Drivers', 'Driver management endpoints')
    .addTag('Coin System', 'Coin management and transactions')
    .addTag('Routes', 'Route management endpoints')
    .addTag('Vehicles', 'Vehicle management endpoints')
    .addTag('Schedules', 'Schedule management endpoints')
    .addTag('Tickets', 'Ticket booking and management')
    .addTag('Travel Documents', 'Travel document management')
    .addTag('Driver Panel', 'Driver-specific endpoints')
    .addTag('Trip Logs', 'Trip logging and tracking')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3001', 'Local Development')
    .addServer('https://api.travelapp.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Mobile Travel App API Docs',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`Swagger API Docs available at: http://localhost:${port}/api/docs`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

void bootstrap();
