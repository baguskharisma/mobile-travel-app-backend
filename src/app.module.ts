import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ValidationPipe } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminsModule } from './modules/admins/admins.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { CoinModule } from './modules/coin/coin.module';
import { RoutesModule } from './modules/routes/routes.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { TravelDocumentsModule } from './modules/travel-documents/travel-documents.module';
import { TripLogsModule } from './modules/trip-logs/trip-logs.module';
import { DriverPanelModule } from './modules/driver-panel/driver-panel.module';
import { PaymentProofsModule } from './modules/payment-proofs/payment-proofs.module';
import { OtpModule } from './modules/otp/otp.module';
import { UploadModule } from './common/upload/upload.module';
import { WebsocketModule } from './websocket/websocket.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests per ttl
      },
    ]),

    // Serve Static Files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Database
    PrismaModule,

    // Common Modules
    UploadModule,
    WebsocketModule,

    // Authentication
    AuthModule,

    // Modules
    AdminsModule,
    CustomersModule,
    DriversModule,
    CoinModule,
    RoutesModule,
    VehiclesModule,
    SchedulesModule,
    TicketsModule,
    TravelDocumentsModule,
    TripLogsModule,
    DriverPanelModule,
    PaymentProofsModule,
    OtpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Apply JWT guard globally
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Apply roles guard globally
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply rate limiting globally
    },
    // Global Filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global Pipes
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
        transform: true, // Automatically transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Allow implicit type conversion
        },
      }),
    },
  ],
})
export class AppModule {}
