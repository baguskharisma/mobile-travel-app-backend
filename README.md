# Mobile Travel App Backend

Backend API untuk aplikasi mobile travel menggunakan NestJS framework dengan TypeScript.

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (Access & Refresh Tokens)
- **File Upload**: Multer
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator

## Features

- **User Management**: Complete CRUD for Admins, Customers, and Drivers with profile image, birthDate, and gender support
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Token Revocation**: Secure logout with token blacklisting
- **Payment Proof System**: Upload and verification workflow for customer bookings
- **Coin System**: Top-up requests and transaction tracking with admin-specific endpoints
- **Route & Vehicle Management**: Travel routes and vehicle fleet with image upload
- **Schedule Management**: Trip scheduling with conflict detection and cost tracking
- **Ticket Booking**: Passenger booking with seat selection and payment proof integration
- **Travel Documents**: Digital travel permits with PDF generation
- **Driver Panel**: Real-time trip tracking and passenger management
- **Trip Logs**: Complete audit trail of all trips

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- npm or yarn

## Installation

```bash
# Clone repository
$ git clone <repository-url>

# Install dependencies
$ npm install

# Setup environment variables
$ cp .env.example .env
# Edit .env file with your database credentials
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mobile_travel_app_db"
JWT_ACCESS_SECRET="your-access-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_ACCESS_EXPIRES="1h"
JWT_REFRESH_EXPIRES="7d"
PORT=3001
```

## Database Setup

```bash
# Generate Prisma Client
$ npx prisma generate

# Push schema to database
$ npx prisma db push

# Or run migrations
$ npx prisma migrate dev
```

## Running the Application

```bash
# Development mode
$ npm run start:dev

# Production mode
$ npm run build
$ npm run start:prod
```

## API Documentation

Setelah aplikasi berjalan, akses dokumentasi Swagger di:
- **Local**: http://localhost:3001/api/docs
- **Base URL**: http://localhost:3001/api/v1

## Authentication & Authorization

### User Roles
- **SUPER_ADMIN**: Full system access
- **ADMIN**: Manage bookings, schedules, and operations
- **DRIVER**: Access to assigned trips and status updates
- **CUSTOMER**: Book tickets and manage profile

### Authentication Flow

#### 1. Register (Customer)
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "081234567890",
  "email": "john@example.com",
  "password": "Customer123",
  "address": "Jl. Sudirman No. 123",
  "birthDate": "1990-05-15",
  "gender": "MALE"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "phone": "081234567890",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "status": "ACTIVE",
    "profile": {
      "id": "uuid",
      "name": "John Doe",
      "phone": "081234567890"
    }
  }
}
```

#### 2. Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "phone": "081234567890",
  "password": "Customer123"
}
```

Response: Same as register response

#### 3. Get Profile
```bash
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "id": "uuid",
  "phone": "081234567890",
  "email": "john@example.com",
  "role": "CUSTOMER",
  "status": "ACTIVE",
  "profile": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "081234567890"
  }
}
```

#### 4. Logout (Token Revocation)
```bash
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "message": "Logout successful"
}
```

**How Logout Works:**
- Token is immediately added to the blacklist database
- All subsequent requests with the same token will receive `401 Unauthorized`
- Token remains blacklisted until its original expiration time
- The blacklist is checked automatically on every authenticated request

**After Logout:**
```bash
# Trying to use the same token will fail
GET /api/v1/auth/me
Authorization: Bearer <revoked-token>

# Response: 401 Unauthorized
{
  "statusCode": 401,
  "message": "Token has been revoked",
  "error": "Unauthorized"
}
```

#### 5. Refresh Token
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response: New access and refresh tokens

### Token Security Features

1. **Token Blacklisting**
   - Revoked tokens are stored in database
   - Automatic validation on every request
   - Tokens auto-expire based on original expiration time

2. **JWT Strategy**
   - Validates token signature
   - Checks token type (access vs refresh)
   - Verifies user status (ACTIVE only)
   - Checks blacklist status
   - Validates user existence

3. **Best Practices**
   - Always logout when user explicitly signs out
   - Store tokens securely (never in localStorage for sensitive apps)
   - Implement refresh token rotation
   - Use short-lived access tokens (1 hour)
   - Use longer-lived refresh tokens (7 days)

## User Profile Fields

All user profiles (Admin, Customer, Driver) support the following personal information fields:

### Birth Date
- **Field**: `birthDate`
- **Type**: DateTime (optional)
- **Format**: ISO 8601 date string (YYYY-MM-DD)
- **Example**: `"1990-05-15"`
- **Validation**: Must be valid date format
- **Usage**: Can be provided during registration/creation or updated later

### Gender
- **Field**: `gender`
- **Type**: Enum (optional)
- **Values**:
  - `MALE` - Male
  - `FEMALE` - Female
  - `OTHER` - Other/Prefer not to say
- **Example**: `"MALE"`
- **Usage**: Can be provided during registration/creation or updated later

### Example Usage

**During Registration:**
```json
{
  "name": "John Doe",
  "phone": "081234567890",
  "password": "Customer123",
  "birthDate": "1990-05-15",
  "gender": "MALE"
}
```

**Updating Profile:**
```json
PATCH /api/v1/customers/:id
{
  "name": "John Doe Updated",
  "birthDate": "1990-05-15",
  "gender": "MALE"
}
```

**Note**: Both fields are optional and can be omitted. Existing users without these fields will have `null` values until updated.

## Coin System

### Admin Coin Management
- Ticket booking: 10,000 coins per passenger
- Travel document issuance: 10,000 coins per document
- Admins request coin top-ups from SUPER_ADMIN
- Complete transaction history tracking

### Coin Request Flow
1. Admin creates coin request
2. SUPER_ADMIN reviews and approves/rejects
3. Coins automatically added upon approval
4. All transactions logged with balance tracking

## Payment Proof System

### Flow
1. Customer uploads payment proof with booking details
2. Admin reviews the payment proof
3. Admin approves → Ticket automatically created with CONFIRMED status
4. Admin rejects → Customer notified with rejection reason

### Features
- File upload (Images: JPG, PNG | PDF)
- Maximum file size: 5MB
- Automatic ticket creation on approval
- Seat availability validation
- Role-based access control

## Key Endpoints

### Authentication
- `POST /auth/register` - Customer registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout and revoke token

### Coin System
- `POST /coin-requests` - Create coin top-up request
- `GET /coin-requests` - List coin requests
- `PATCH /coin-requests/:id/approve` - Approve request (SUPER_ADMIN)
- `PATCH /coin-requests/:id/reject` - Reject request (SUPER_ADMIN)
- `GET /coin-transactions` - Transaction history
- `GET /coin-transactions/balance` - Current balance

### Tickets
- `POST /tickets` - Create ticket booking
- `GET /tickets` - List tickets
- `GET /tickets/:id` - Get ticket details
- `PATCH /tickets/:id/confirm` - Confirm payment
- `PATCH /tickets/:id/cancel` - Cancel ticket

### Payment Proofs
- `POST /payment-proofs` - Upload payment proof
- `GET /payment-proofs` - Get all proofs (Admin)
- `GET /payment-proofs/my-proofs` - Get own proofs (Customer)
- `PATCH /payment-proofs/:id/approve` - Approve and create ticket
- `PATCH /payment-proofs/:id/reject` - Reject with reason

### Driver Panel
- `GET /driver/profile` - Driver profile and stats
- `GET /driver/trips` - Assigned trips
- `GET /driver/trips/:scheduleId/passengers` - Passenger manifest
- `POST /driver/trips/:scheduleId/status` - Update trip status

## Database Schema

### Key Models
- **User**: Base authentication table (includes birthDate, gender)
- **Admin, Customer, Driver**: Role-specific profiles (includes birthDate, gender)
- **TokenBlacklist**: Revoked JWT tokens
- **Route**: Travel routes
- **Vehicle**: Fleet management
- **Schedule**: Trip schedules
- **Ticket**: Booking records
- **Passenger**: Passenger details
- **PaymentProof**: Payment verification system
- **TravelDocument**: Digital travel permits
- **CoinRequest**: Coin top-up requests
- **CoinTransaction**: Transaction history
- **TripLog**: Driver trip tracking

## Error Handling

Standard error response format:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (Invalid or revoked token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `409` - Conflict

## Testing

```bash
# Unit tests
$ npm run test

# E2E tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```

## Deployment

```bash
# Build for production
$ npm run build

# Start production server
$ npm run start:prod
```

## Project Structure

```
src/
├── auth/               # Authentication & Authorization
│   ├── decorators/     # Custom decorators (Public, CurrentUser, Roles)
│   ├── dto/            # Data Transfer Objects
│   ├── guards/         # Auth guards (JWT, Refresh, Roles)
│   ├── strategies/     # Passport strategies
│   └── types/          # TypeScript types
├── admins/             # Admin management
├── customers/          # Customer management
├── drivers/            # Driver management
├── coin-requests/      # Coin system
├── coin-transactions/  # Transaction tracking
├── routes/             # Travel routes
├── vehicles/           # Vehicle fleet
├── schedules/          # Trip schedules
├── tickets/            # Ticket bookings
├── payment-proofs/     # Payment verification
├── travel-documents/   # Travel permits
├── driver-panel/       # Driver endpoints
├── trip-logs/          # Trip tracking
├── prisma/             # Database service
└── uploads/            # File upload handling

prisma/
└── schema.prisma       # Database schema

docs/
└── api-documentation.yaml  # OpenAPI documentation
```

## Development Notes

### Adding New Features
1. Create module: `nest g module feature-name`
2. Create controller: `nest g controller feature-name`
3. Create service: `nest g service feature-name`
4. Update Prisma schema if needed
5. Add DTOs with validation
6. Implement role guards if needed
7. Add API documentation

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma db push` for development
3. Run `npx prisma migrate dev --name description` for production migrations
4. Run `npx prisma generate` to update Prisma Client

## Security Considerations

- JWT tokens with short expiration times
- Token blacklisting for logout
- Password hashing with bcrypt
- Role-based access control
- Input validation with class-validator
- File upload validation (size, type)
- Soft delete for user records
- SQL injection prevention (Prisma ORM)

## Support

For issues and questions, please contact the development team or create an issue in the repository.

## License

This project is [MIT licensed](LICENSE).
