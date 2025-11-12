# Mobile Travel App API Documentation

## 📚 Overview

Comprehensive REST API documentation for the Mobile Travel App Backend System. The API provides complete functionality for managing a travel/transportation business including user management, booking systems with payment proof verification, coin-based payments, and real-time trip tracking.

## 🆕 Latest Updates (December 2025)

### OTP Verification System (New!)
Customer registration sekarang dilindungi dengan sistem verifikasi OTP via WhatsApp menggunakan Twilio.

**📱 OTP Features:**
- ✅ **WhatsApp Integration** - OTP dikirim via WhatsApp menggunakan Twilio
- ✅ **6-Digit Code** - Kode OTP 6 digit yang aman
- ✅ **5-Minute Validity** - OTP berlaku selama 5 menit
- ✅ **3 Attempts Limit** - Maksimal 3 kali percobaan verifikasi
- ✅ **Rate Limiting** - Cegah spam dengan throttling (max 1 OTP per 4 menit)
- ✅ **30-Minute Grace Period** - Status verified berlaku 30 menit untuk registrasi

**Endpoints:**
- `POST /otp/send` - Send OTP to phone number
- `POST /otp/verify` - Verify OTP code
- `POST /auth/register` - Register (requires OTP verification first)

**Testing & Troubleshooting:**
```bash
# Test Twilio credentials dan koneksi
node scripts/test-twilio.js

# Test send WhatsApp message
node scripts/test-twilio.js +6281234567890
```

📖 **Setup Guide**: Lihat [OTP_SETUP_GUIDE.md](./OTP_SETUP_GUIDE.md) untuk instruksi lengkap setup Twilio dan troubleshooting.

**📖 [Setup Guide & Troubleshooting](./OTP_SETUP_GUIDE.md)**

### API Documentation v2.0.0
Dokumentasi API telah diupdate dari v1.0.0 ke v2.0.0 dengan penambahan **55 endpoint baru**. Sekarang **106 endpoints** telah terdokumentasi lengkap (sebelumnya hanya 49).

**✨ What's New:**
- ✅ **OTP Verification System** - WhatsApp-based OTP for secure registration
- ✅ **Payment Proof System** - Complete upload & verification workflow
- ✅ **User Management CRUD** - Full endpoints untuk Admins, Customers, Drivers
- ✅ **Profile Image Upload** - Support upload/delete image untuk semua user types
- ✅ **Vehicle Image Management** - Upload dan manage foto kendaraan
- ✅ **Enhanced Admin Controls** - SUPER_ADMIN dapat view coin balance admin lain
- ✅ **Soft Delete & Restore** - Untuk Admin dan Routes
- ✅ **User Profile Fields** - Birth date dan gender support untuk semua user types

### Payment Proof System
Customer booking flow sekarang memerlukan upload bukti pembayaran yang harus diverifikasi admin sebelum tiket dibuat.

**📖 [Dokumentasi Lengkap Payment Proof Flow](./PAYMENT_PROOF_FLOW.md)**

**Key Features:**
- ✅ Upload payment proof (image/PDF) saat booking
- ✅ Admin review & approve/reject payment proof
- ✅ Auto-create ticket saat approved
- ✅ Seat validation sebelum approval
- ✅ Coin deduction hanya saat approved

**Endpoints:**
- `POST /payment-proofs` - Upload payment proof
- `GET /payment-proofs` - List payment proofs (admin)
- `GET /payment-proofs/my-proofs` - Get own payment proofs (customer)
- `GET /payment-proofs/:id` - Get specific payment proof
- `PATCH /payment-proofs/:id/approve` - Approve proof & create ticket
- `PATCH /payment-proofs/:id/reject` - Reject proof with reason
- `DELETE /payment-proofs/:id` - Delete payment proof

## 🚀 Quick Start

### Accessing the Documentation

**Swagger UI (Interactive)**
```
http://localhost:3001/api/docs
```

**OpenAPI Specification (YAML)**
```
docs/api-documentation.yaml
```

### Authentication

All endpoints (except login) require JWT Bearer token authentication.

1. **Login** to get access token:
   ```bash
   POST /api/v1/auth/login
   {
     "email": "admin@example.com",
     "password": "Admin123"
   }
   ```

2. **Use the token** in subsequent requests:
   ```
   Authorization: Bearer <your-token>
   ```

3. **In Swagger UI**: Click "Authorize" button and enter: `Bearer <your-token>`

## 📋 API Modules

### 1. **OTP Verification** 📱
- `POST /otp/send` - Send OTP via WhatsApp (Twilio)
- `POST /otp/verify` - Verify OTP code
- WhatsApp-based verification using Twilio
- 6-digit code valid for 5 minutes
- Maximum 3 verification attempts
- Rate limiting (max 1 OTP per 4 minutes)

### 2. **Authentication**
- User login and JWT token generation
- Customer registration with OTP verification
- Token refresh and logout with blacklisting
- Role-based access control (SUPER_ADMIN, ADMIN, DRIVER, CUSTOMER)

### 3. **User Management** 👥
Complete CRUD operations with profile image support:

#### **Admins** (SUPER_ADMIN only)
- `POST /admins` - Create admin
- `GET /admins` - List all admins
- `GET /admins/profile/me` - Get own profile
- `PATCH /admins/profile/me` - Update own profile
- `GET /admins/:id` - Get specific admin
- `PATCH /admins/:id` - Update admin
- `DELETE /admins/:id` - Soft delete admin
- `PATCH /admins/:id/restore` - Restore deleted admin
- `PATCH /admins/:id/status` - Update admin status
- `POST /admins/profile/image` - Upload own image
- `POST /admins/:id/image` - Upload admin image
- `DELETE /admins/profile/image` - Delete own image
- `DELETE /admins/:id/image` - Delete admin image

#### **Customers**
- `GET /customers` - List all customers (admin)
- `GET /customers/profile/me` - Get own profile
- `PATCH /customers/profile/me` - Update own profile
- `GET /customers/:id` - Get specific customer (admin)
- `PATCH /customers/:id` - Update customer (admin)
- `POST /customers/profile/image` - Upload own image
- `POST /customers/:id/image` - Upload customer image (admin)
- `DELETE /customers/profile/image` - Delete own image
- `DELETE /customers/:id/image` - Delete customer image (admin)

#### **Drivers**
- `POST /drivers` - Create driver
- `GET /drivers` - List all drivers
- `GET /drivers/profile/me` - Get own profile
- `PATCH /drivers/profile/me` - Update own profile
- `PATCH /drivers/:id` - Update driver (admin)
- `PATCH /drivers/:id/status` - Update driver status
- `POST /drivers/profile/image` - Upload own image
- `POST /drivers/:id/image` - Upload driver image (admin)
- `DELETE /drivers/profile/image` - Delete own image
- `DELETE /drivers/:id/image` - Delete driver image (admin)

### 4. **Coin System** 💰
- **Coin Requests**: Top-up requests and approval workflow
  - `POST /coin-requests` - Create request
  - `GET /coin-requests` - List requests
  - `GET /coin-requests/:id` - Get specific request
  - `PATCH /coin-requests/:id/approve` - Approve (SUPER_ADMIN)
  - `PATCH /coin-requests/:id/reject` - Reject (SUPER_ADMIN)
- **Coin Transactions**: Transaction history and balance tracking
  - `GET /coin-transactions` - List transactions
  - `GET /coin-transactions/balance` - Get own balance
  - `GET /admins/:adminId/coin-balance` - Get admin's balance (SUPER_ADMIN)
  - `GET /admins/:adminId/coin-transactions` - Get admin's transactions (SUPER_ADMIN)
- **Auto-deduction**:
  - Ticket booking: 10,000 coins per passenger
  - Travel document: 10,000 coins per document

### 5. **Travel Operations**
- **Routes**: Travel route management
  - `POST /routes` - Create route
  - `GET /routes` - List routes
  - `GET /routes/:id` - Get specific route
  - `PATCH /routes/:id` - Update route
  - `DELETE /routes/:id` - Soft delete route
  - `PATCH /routes/:id/restore` - Restore route (SUPER_ADMIN)
- **Vehicles**: Fleet management with image support
  - `POST /vehicles` - Create vehicle
  - `GET /vehicles` - List vehicles
  - `GET /vehicles/available` - Get available vehicles
  - `GET /vehicles/:id` - Get specific vehicle
  - `PATCH /vehicles/:id` - Update vehicle
  - `PATCH /vehicles/:id/status` - Update status
  - `POST /vehicles/:id/image` - Upload vehicle image
  - `DELETE /vehicles/:id/image` - Delete vehicle image
  - `DELETE /vehicles/:id` - Delete vehicle (SUPER_ADMIN)
- **Schedules**: Trip scheduling with conflict detection
  - `POST /schedules` - Create schedule
  - `GET /schedules` - List schedules
  - `GET /schedules/upcoming` - Get upcoming schedules
  - `GET /schedules/:id` - Get specific schedule
  - `PATCH /schedules/:id` - Update schedule
  - `PATCH /schedules/:id/assign-driver` - Assign driver
  - `PATCH /schedules/:id/cancel` - Cancel schedule
  - `DELETE /schedules/:id` - Delete schedule
  - Driver/vehicle availability validation
  - Automatic seat management
  - Cost tracking (fuel, driver wage, snacks)

### 6. **Booking System**
- **Payment Proofs**: Upload and verification workflow
  - `POST /payment-proofs` - Upload payment proof (customer)
  - `GET /payment-proofs` - List all proofs (admin)
  - `GET /payment-proofs/my-proofs` - Get own proofs (customer)
  - `GET /payment-proofs/:id` - Get specific proof
  - `PATCH /payment-proofs/:id/approve` - Approve & create ticket (admin)
  - `PATCH /payment-proofs/:id/reject` - Reject with reason (admin)
  - `DELETE /payment-proofs/:id` - Delete proof
- **Tickets**: Passenger booking with seat selection
  - `POST /tickets` - Create ticket
  - `GET /tickets` - List tickets
  - `GET /tickets/:id` - Get specific ticket
  - `PATCH /tickets/:id/confirm` - Confirm payment
  - `PATCH /tickets/:id/cancel` - Cancel ticket with refund
  - `DELETE /tickets/:id` - Delete ticket (SUPER_ADMIN)
  - Multiple passengers per booking
  - Pickup and dropoff address tracking
  - Seat conflict prevention
  - Auto coin deduction for admin bookings
  - Cancellation with refund

### 7. **Travel Documents** 📄
- `POST /travel-documents` - Create draft document
- `GET /travel-documents` - List documents
- `GET /travel-documents/:id` - Get specific document
- `PATCH /travel-documents/:id/issue` - Issue document (deducts 10,000 coins)
- `GET /travel-documents/:id/print` - Generate PDF
- `PATCH /travel-documents/:id/cancel` - Cancel document
- `DELETE /travel-documents/:id` - Delete document (SUPER_ADMIN)
- Digital travel permits (Surat Jalan)
- PDF generation with professional formatting
- Coin-based issuance (10,000 coins)
- Indonesian language format

### 8. **Driver Panel** 🚗
- `GET /driver/profile` - Get driver profile & statistics
- `GET /driver/trips` - Get assigned trips
- `GET /driver/trips/:scheduleId` - Get trip details
- `GET /driver/trips/:scheduleId/passengers` - Get passenger manifest
- `POST /driver/trips/:scheduleId/status` - Update trip status with GPS
- Driver profile and statistics
- Assigned trips management
- Passenger boarding manifest
- Real-time trip status updates with GPS tracking

### 9. **Trip Logging**
- Complete trip audit trail
- Status changes tracking
- Location history
- Trip reports and analytics

## 📊 API Summary

**Total Endpoints:** 106
**API Version:** 2.0.0
**Base URL:** `/api/v1`

**Breakdown by Module:**
- OTP Verification: 2 endpoints (NEW)
- Authentication: 4 endpoints
- Admins: 13 endpoints
- Customers: 9 endpoints
- Drivers: 10 endpoints
- Payment Proofs: 7 endpoints
- Coin System: 6 endpoints
- Routes: 6 endpoints
- Vehicles: 9 endpoints
- Schedules: 8 endpoints
- Tickets: 6 endpoints
- Travel Documents: 7 endpoints
- Driver Panel: 5 endpoints
- Trip Logs: 14 endpoints

## 🔐 Role-Based Access

| Role | Access Level | Key Permissions |
|------|-------------|-----------------|
| **SUPER_ADMIN** | Full access | All operations, approve coin requests, manage admins |
| **ADMIN** | Management | Create bookings, issue documents, manage resources |
| **DRIVER** | Limited | View assigned trips, update trip status, view passengers |
| **CUSTOMER** | Basic | Book tickets, upload payment proofs, view own bookings |

## 💡 Common Use Cases

### For Admins

#### 1. Create a Trip Schedule
```bash
POST /api/v1/schedules
{
  "routeId": "route-uuid",
  "vehicleId": "vehicle-uuid",
  "driverId": "driver-uuid",
  "departureTime": "2025-01-10T08:00:00Z",
  "price": 120000,
  "availableSeats": 16,
  "fuelCost": 300000,      // Optional: Biaya BBM
  "driverWage": 200000,    // Optional: Upah sopir
  "snackCost": 150000      // Optional: Biaya snack
}
```

#### 2. Book Tickets for Customer
```bash
POST /api/v1/tickets
{
  "scheduleId": "schedule-uuid",
  "bookingSource": "ADMIN_PANEL",
  "pickupAddress": "Jl. Sudirman No. 123, Jakarta Pusat",   // Required
  "dropoffAddress": "Jl. Dago No. 456, Bandung",            // Required
  "passengers": [
    {
      "name": "John Doe",
      "identityNumber": "1234567890123456",
      "phone": "081234567890",
      "seatNumber": "A1"
    }
  ]
}
```
**Note**: This will automatically deduct 10,000 coins per passenger.

#### 3. Review Payment Proofs (NEW)
```bash
# Get all pending payment proofs
GET /api/v1/payment-proofs?status=PENDING

# Approve payment proof (creates ticket automatically)
PATCH /api/v1/payment-proofs/{id}/approve
{
  "notes": "Payment verified, ticket created"
}

# Reject payment proof
PATCH /api/v1/payment-proofs/{id}/reject
{
  "rejectedReason": "Invalid payment proof or amount mismatch"
}
```

#### 4. Issue Travel Document
```bash
# Create draft
POST /api/v1/travel-documents
{
  "scheduleId": "schedule-uuid",
  "vehicleId": "vehicle-uuid",
  "driverName": "Ahmad Supardi",
  "driverPhone": "081234567890",
  "totalPassengers": 12,
  "departureDate": "2025-01-10T08:00:00Z"
}

# Issue document (deducts 10,000 coins)
PATCH /api/v1/travel-documents/{id}/issue

# Download PDF
GET /api/v1/travel-documents/{id}/print
```

### For Drivers

#### 1. Check Assigned Trips
```bash
GET /api/v1/driver/trips
```

#### 2. View Passenger List
```bash
GET /api/v1/driver/trips/{scheduleId}/passengers
```

#### 3. Update Trip Status
```bash
POST /api/v1/driver/trips/{scheduleId}/status
{
  "status": "DEPARTED",
  "location": "Terminal Jakarta",
  "latitude": -6.200000,
  "longitude": 106.816666,
  "notes": "Trip started on time"
}
```

### For Customers

#### 1. Register with OTP Verification (NEW - Required)
```bash
# Step 1: Send OTP to WhatsApp
POST /api/v1/otp/send
{
  "phone": "081234567890"
}

# Response:
{
  "message": "OTP sent successfully to your WhatsApp",
  "expiresIn": 300,
  "phone": "081234567890"
}

# Step 2: Verify OTP code
POST /api/v1/otp/verify
{
  "phone": "081234567890",
  "code": "123456"
}

# Response:
{
  "message": "OTP verified successfully",
  "verified": true,
  "phone": "081234567890"
}

# Step 3: Register account (must be done within 30 minutes of OTP verification)
POST /api/v1/auth/register
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

#### 2. Browse Upcoming Trips
```bash
# Default (nearest departure)
GET /api/v1/schedules/upcoming?limit=20

# Find cheapest trips
GET /api/v1/schedules?sortBy=cheapest&limit=20

# Find nearest departures to specific destination
GET /api/v1/schedules?destination=Bandung&sortBy=nearest
```

#### 3. Book with Payment Proof (Recommended)
```bash
POST /api/v1/payment-proofs
Content-Type: multipart/form-data

scheduleId: schedule-uuid
bookingSource: CUSTOMER_APP
bookerPhone: 081234567890
pickupAddress: Jl. Gatot Subroto No. 789, Jakarta
dropoffAddress: Jl. Asia Afrika No. 321, Bandung
passengers: [{"name": "Jane Smith", "phone": "081234567890", "seatNumber": "B2"}]
paymentProof: [file upload - image or PDF, max 5MB]
notes: Transfer via BCA
```

#### 4. Check Payment Proof Status
```bash
GET /api/v1/payment-proofs/my-proofs
```

#### 5. Direct Ticket Booking (Alternative)
```bash
POST /api/v1/tickets
{
  "scheduleId": "schedule-uuid",
  "bookingSource": "CUSTOMER_APP",
  "pickupAddress": "Jl. Gatot Subroto No. 789, Jakarta",
  "dropoffAddress": "Jl. Asia Afrika No. 321, Bandung",
  "passengers": [
    {
      "name": "Jane Smith",
      "phone": "081234567890",
      "seatNumber": "B2"
    }
  ]
}
```

#### 6. View My Tickets
```bash
GET /api/v1/tickets
```

## 📊 Response Formats

### Success Response (Single Item)
```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  ...
}
```

### Success Response (List with Pagination)
```json
{
  "data": [
    { "id": "uuid", "field1": "value1" },
    { "id": "uuid", "field2": "value2" }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Validation Error Response
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

## 🎯 Status Flows

### Ticket Status Flow
```
PENDING → CONFIRMED → COMPLETED
         ↓
      CANCELLED/REFUNDED
```

### Schedule Status Flow
```
SCHEDULED → DEPARTED → ARRIVED
          ↓
       CANCELLED
```

### Trip Status Flow
```
ASSIGNED → READY → DEPARTED → IN_TRANSIT → ARRIVED → COMPLETED
                              ↓
                          REST_STOP
```

### Travel Document Status Flow
```
DRAFT → ISSUED (final)
  ↓
CANCELLED (only from DRAFT)
```

## 📦 Data Models & Schemas

### User
```typescript
{
  id: string;              // UUID
  email: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "DRIVER" | "CUSTOMER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  lastLoginAt: string | null;  // ISO 8601 date
  createdAt: string;           // ISO 8601 date
  updatedAt: string;           // ISO 8601 date
}
```

### Admin
```typescript
{
  id: string;
  userId: string;
  name: string;
  phone: string;
  coinBalance: number;
  createdAt: string;
  updatedAt: string;
  user?: User;              // Optional nested object
}
```

### Customer
```typescript
{
  id: string;
  userId: string;
  name: string;
  phone: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
}
```

### Driver
```typescript
{
  id: string;
  userId: string;
  name: string;
  phone: string;
  licenseNumber: string | null;
  address: string | null;
  status: "AVAILABLE" | "ON_TRIP" | "OFF_DUTY";
  createdAt: string;
  updatedAt: string;
  user?: User;
}
```

### Route
```typescript
{
  id: string;
  routeCode: string;        // e.g., "JKT-BDG-001"
  origin: string;
  destination: string;
  distance: number | null;  // in kilometers
  estimatedDuration: number | null;  // in minutes
  basePrice: number;        // in IDR
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Vehicle
```typescript
{
  id: string;
  vehicleNumber: string;    // e.g., "B 1234 ABC"
  type: "EKSEKUTIF" | "REGULAR";
  brand: string | null;
  model: string | null;
  capacity: number;
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED";
  createdAt: string;
  updatedAt: string;
}
```

### Schedule
```typescript
{
  id: string;
  routeId: string;
  vehicleId: string;
  driverId: string | null;
  departureTime: string;    // ISO 8601
  arrivalTime: string | null;
  price: number;
  availableSeats: number;
  fuelCost: number | null;      // NEW: Biaya BBM
  driverWage: number | null;    // NEW: Upah sopir
  snackCost: number | null;     // NEW: Biaya snack
  status: "SCHEDULED" | "DEPARTED" | "ARRIVED" | "CANCELLED";
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  // Nested relations (when included)
  route?: Route;
  vehicle?: Vehicle;
  driver?: Driver;
  tickets?: Ticket[];
  _count?: {
    tickets: number;
  };
}
```

### Ticket
```typescript
{
  id: string;
  ticketNumber: string;     // Format: TKT-YYYYMMDD-XXXXX
  scheduleId: string;
  customerId: string | null;
  adminId: string | null;
  bookingSource: "CUSTOMER_APP" | "ADMIN_PANEL";
  pickupAddress: string;    // NEW: Alamat jemput (required)
  dropoffAddress: string;   // NEW: Alamat antar (required)
  totalPassengers: number;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REFUNDED";
  bookingDate: string;
  paymentDate: string | null;
  notes: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  // Nested relations
  schedule?: Schedule;
  customer?: Customer;
  admin?: Admin;
  passengers?: Passenger[];
}
```

### Passenger
```typescript
{
  id: string;
  ticketId: string;
  name: string;
  identityNumber: string | null;  // NIK/KTP 16 digits
  phone: string | null;
  seatNumber: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### TravelDocument
```typescript
{
  id: string;
  documentNumber: string;   // Format: SJ-YYYYMMDD-XXXXX
  scheduleId: string;
  vehicleId: string;
  adminId: string;
  driverName: string;
  driverPhone: string;
  totalPassengers: number;
  departureDate: string;
  status: "DRAFT" | "ISSUED" | "CANCELLED";
  issuedAt: string | null;
  notes: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  // Nested relations
  schedule?: Schedule;
  vehicle?: Vehicle;
  admin?: Admin;
}
```

### TripLog
```typescript
{
  id: string;
  scheduleId: string;
  driverId: string;
  status: "ASSIGNED" | "READY" | "DEPARTED" | "IN_TRANSIT" |
          "REST_STOP" | "ARRIVED" | "COMPLETED" | "CANCELLED";
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  timestamp: string;
  // Nested relations
  schedule?: Schedule;
  driver?: Driver;
}
```

### CoinRequest
```typescript
{
  id: string;
  adminId: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
  // Nested relations
  admin?: Admin;
}
```

### CoinTransaction
```typescript
{
  id: string;
  adminId: string;
  type: "TOP_UP" | "DEDUCTION" | "REFUND";
  reason: "TOP_UP_APPROVED" | "TICKET_BOOKING" |
          "TRAVEL_DOCUMENT" | "TICKET_CANCELLATION";
  amount: number;           // Positive or negative
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string | null;
  referenceType: string | null;  // "ticket", "travel_document", "coin_request"
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  // Nested relations
  admin?: Admin;
}
```

## 💰 Coin System

### Costs
- **Ticket Booking**: 10,000 coins per passenger
- **Travel Document**: 10,000 coins per document

### Workflow
1. Admin requests top-up via `POST /coin-requests`
2. Super Admin approves via `PATCH /coin-requests/{id}/approve`
3. Coins automatically deducted on:
   - Ticket booking (admin only)
   - Travel document issuance
4. Coins automatically refunded on:
   - Ticket cancellation (admin bookings)

### Check Balance
```bash
GET /api/v1/coin-transactions/balance
```

## 🔍 Filtering & Search

Most list endpoints support filtering:

**Common Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status
- `search`: Search by relevant fields
- `dateFrom`, `dateTo`: Date range filters

**Example:**
```bash
GET /api/v1/tickets?status=CONFIRMED&page=1&limit=20&search=TKT-20250110
```

## 📡 API Endpoint Examples with Responses

### 🔐 Authentication

#### POST /api/v1/auth/login
**Request:**
```json
{
  "email": "admin@example.com",
  "password": "Admin123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@example.com",
    "role": "ADMIN",
    "status": "ACTIVE"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

### 💰 Coin System

#### POST /api/v1/coin-requests
**Request:**
```json
{
  "amount": 100000,
  "notes": "Top-up for monthly operations"
}
```

**Response (201 Created):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "adminId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 100000,
  "status": "PENDING",
  "notes": "Top-up for monthly operations",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedBy": null,
  "rejectedAt": null,
  "rejectedReason": null,
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z"
}
```

#### GET /api/v1/coin-transactions/balance
**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Admin",
  "coinBalance": 250000
}
```

#### GET /api/v1/coin-transactions?page=1&limit=10
**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "tx-001",
      "adminId": "admin-001",
      "type": "TOP_UP",
      "reason": "TOP_UP_APPROVED",
      "amount": 100000,
      "balanceBefore": 150000,
      "balanceAfter": 250000,
      "referenceId": "cr-001",
      "referenceType": "coin_request",
      "notes": "Top-up approved",
      "createdBy": "superadmin-001",
      "createdAt": "2025-01-10T08:00:00.000Z"
    },
    {
      "id": "tx-002",
      "adminId": "admin-001",
      "type": "DEDUCTION",
      "reason": "TICKET_BOOKING",
      "amount": -20000,
      "balanceBefore": 250000,
      "balanceAfter": 230000,
      "referenceId": "ticket-001",
      "referenceType": "ticket",
      "notes": "Ticket booking: 2 passenger(s)",
      "createdBy": "admin-001",
      "createdAt": "2025-01-10T09:00:00.000Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 🛣️ Routes

#### POST /api/v1/routes
**Request:**
```json
{
  "routeCode": "JKT-BDG-001",
  "origin": "Jakarta",
  "destination": "Bandung",
  "distance": 150,
  "estimatedDuration": 180,
  "basePrice": 100000
}
```

**Response (201 Created):**
```json
{
  "id": "route-001",
  "routeCode": "JKT-BDG-001",
  "origin": "Jakarta",
  "destination": "Bandung",
  "distance": 150,
  "estimatedDuration": 180,
  "basePrice": 100000,
  "isActive": true,
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z"
}
```

#### GET /api/v1/routes?page=1&limit=10&isActive=true
**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "route-001",
      "routeCode": "JKT-BDG-001",
      "origin": "Jakarta",
      "destination": "Bandung",
      "distance": 150,
      "estimatedDuration": 180,
      "basePrice": 100000,
      "isActive": true,
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-01-10T08:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### GET /api/v1/routes/{id}
**Response (200 OK):**
```json
{
  "id": "route-001",
  "routeCode": "JKT-BDG-001",
  "origin": "Jakarta",
  "destination": "Bandung",
  "distance": 150,
  "estimatedDuration": 180,
  "basePrice": 100000,
  "isActive": true,
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z"
}
```

---

### 🚗 Vehicles

#### POST /api/v1/vehicles
**Request:**
```json
{
  "vehicleNumber": "B 1234 ABC",
  "type": "EKSEKUTIF",
  "brand": "Mercedes-Benz",
  "model": "Sprinter",
  "capacity": 16
}
```

**Response (201 Created):**
```json
{
  "id": "vehicle-001",
  "vehicleNumber": "B 1234 ABC",
  "type": "EKSEKUTIF",
  "brand": "Mercedes-Benz",
  "model": "Sprinter",
  "capacity": 16,
  "status": "AVAILABLE",
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z"
}
```

#### GET /api/v1/vehicles/available
**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "vehicle-001",
      "vehicleNumber": "B 1234 ABC",
      "type": "EKSEKUTIF",
      "brand": "Mercedes-Benz",
      "model": "Sprinter",
      "capacity": 16,
      "status": "AVAILABLE",
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-01-10T08:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 📅 Schedules

#### POST /api/v1/schedules
**Request:**
```json
{
  "routeId": "route-001",
  "vehicleId": "vehicle-001",
  "driverId": "driver-001",
  "departureTime": "2025-01-15T08:00:00Z",
  "arrivalTime": "2025-01-15T11:00:00Z",
  "price": 120000,
  "availableSeats": 16,
  "fuelCost": 300000,
  "driverWage": 200000,
  "snackCost": 150000
}
```

**Response (201 Created):**
```json
{
  "id": "schedule-001",
  "routeId": "route-001",
  "vehicleId": "vehicle-001",
  "driverId": "driver-001",
  "departureTime": "2025-01-15T08:00:00.000Z",
  "arrivalTime": "2025-01-15T11:00:00.000Z",
  "price": 120000,
  "availableSeats": 16,
  "fuelCost": 300000,
  "driverWage": 200000,
  "snackCost": 150000,
  "status": "SCHEDULED",
  "cancelledAt": null,
  "cancelledBy": null,
  "cancelReason": null,
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z",
  "route": {
    "id": "route-001",
    "routeCode": "JKT-BDG-001",
    "origin": "Jakarta",
    "destination": "Bandung",
    "distance": 150,
    "estimatedDuration": 180,
    "basePrice": 100000,
    "isActive": true,
    "createdAt": "2025-01-10T08:00:00.000Z",
    "updatedAt": "2025-01-10T08:00:00.000Z"
  },
  "vehicle": {
    "id": "vehicle-001",
    "vehicleNumber": "B 1234 ABC",
    "type": "EKSEKUTIF",
    "brand": "Mercedes-Benz",
    "model": "Sprinter",
    "capacity": 16,
    "status": "IN_USE",
    "createdAt": "2025-01-10T08:00:00.000Z",
    "updatedAt": "2025-01-10T08:00:00.000Z"
  },
  "driver": {
    "id": "driver-001",
    "userId": "user-driver-001",
    "name": "Ahmad Supardi",
    "phone": "081234567890",
    "licenseNumber": "1234567890",
    "status": "ON_TRIP",
    "user": {
      "id": "user-driver-001",
      "email": "driver@example.com",
      "status": "ACTIVE"
    }
  }
}
```

#### GET /api/v1/schedules/upcoming?limit=20
**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "schedule-001",
      "routeId": "route-001",
      "vehicleId": "vehicle-001",
      "driverId": "driver-001",
      "departureTime": "2025-01-15T08:00:00.000Z",
      "arrivalTime": "2025-01-15T11:00:00.000Z",
      "price": 120000,
      "availableSeats": 14,
      "fuelCost": 300000,
      "driverWage": 200000,
      "snackCost": 150000,
      "status": "SCHEDULED",
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-01-10T08:00:00.000Z",
      "route": {
        "id": "route-001",
        "routeCode": "JKT-BDG-001",
        "origin": "Jakarta",
        "destination": "Bandung"
      },
      "vehicle": {
        "id": "vehicle-001",
        "vehicleNumber": "B 1234 ABC",
        "type": "EKSEKUTIF",
        "brand": "Mercedes-Benz",
        "model": "Sprinter",
        "capacity": 16
      },
      "driver": {
        "id": "driver-001",
        "name": "Ahmad Supardi",
        "phone": "081234567890"
      },
      "_count": {
        "tickets": 2
      }
    }
  ],
  "total": 1
}
```

#### GET /api/v1/schedules/{id}
**Response (200 OK):**
```json
{
  "id": "schedule-001",
  "routeId": "route-001",
  "vehicleId": "vehicle-001",
  "driverId": "driver-001",
  "departureTime": "2025-01-15T08:00:00.000Z",
  "arrivalTime": "2025-01-15T11:00:00.000Z",
  "price": 120000,
  "availableSeats": 14,
  "fuelCost": 300000,
  "driverWage": 200000,
  "snackCost": 150000,
  "status": "SCHEDULED",
  "cancelledAt": null,
  "cancelledBy": null,
  "cancelReason": null,
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z",
  "route": {
    "id": "route-001",
    "routeCode": "JKT-BDG-001",
    "origin": "Jakarta",
    "destination": "Bandung",
    "distance": 150,
    "estimatedDuration": 180,
    "basePrice": 100000,
    "isActive": true
  },
  "vehicle": {
    "id": "vehicle-001",
    "vehicleNumber": "B 1234 ABC",
    "type": "EKSEKUTIF",
    "brand": "Mercedes-Benz",
    "model": "Sprinter",
    "capacity": 16,
    "status": "IN_USE"
  },
  "driver": {
    "id": "driver-001",
    "name": "Ahmad Supardi",
    "phone": "081234567890",
    "licenseNumber": "1234567890",
    "status": "ON_TRIP"
  },
  "tickets": [
    {
      "id": "ticket-001",
      "ticketNumber": "TKT-20250110-00001",
      "totalPassengers": 2,
      "totalPrice": 240000,
      "status": "CONFIRMED",
      "bookingDate": "2025-01-10T09:00:00.000Z",
      "customer": {
        "id": "customer-001",
        "name": "Jane Smith",
        "phone": "081234567891"
      }
    }
  ],
  "_count": {
    "tickets": 2
  }
}
```

---

### 🎫 Tickets

#### POST /api/v1/tickets
**Request (Customer App):**
```json
{
  "scheduleId": "schedule-001",
  "bookingSource": "CUSTOMER_APP",
  "pickupAddress": "Jl. Gatot Subroto No. 789, Jakarta",
  "dropoffAddress": "Jl. Asia Afrika No. 321, Bandung",
  "passengers": [
    {
      "name": "Jane Smith",
      "identityNumber": "1234567890123456",
      "phone": "081234567891",
      "seatNumber": "A1"
    },
    {
      "name": "John Doe",
      "identityNumber": "6543210987654321",
      "phone": "081234567892",
      "seatNumber": "A2"
    }
  ],
  "notes": "Please call 30 minutes before pickup"
}
```

**Response (201 Created):**
```json
{
  "id": "ticket-001",
  "ticketNumber": "TKT-20250110-00001",
  "scheduleId": "schedule-001",
  "customerId": "customer-001",
  "adminId": null,
  "bookingSource": "CUSTOMER_APP",
  "pickupAddress": "Jl. Gatot Subroto No. 789, Jakarta",
  "dropoffAddress": "Jl. Asia Afrika No. 321, Bandung",
  "totalPassengers": 2,
  "totalPrice": 240000,
  "status": "PENDING",
  "bookingDate": "2025-01-10T09:00:00.000Z",
  "paymentDate": null,
  "notes": "Please call 30 minutes before pickup",
  "cancelledAt": null,
  "cancelledBy": null,
  "cancelReason": null,
  "createdAt": "2025-01-10T09:00:00.000Z",
  "updatedAt": "2025-01-10T09:00:00.000Z",
  "schedule": {
    "id": "schedule-001",
    "departureTime": "2025-01-15T08:00:00.000Z",
    "price": 120000,
    "route": {
      "id": "route-001",
      "routeCode": "JKT-BDG-001",
      "origin": "Jakarta",
      "destination": "Bandung"
    },
    "vehicle": {
      "id": "vehicle-001",
      "vehicleNumber": "B 1234 ABC",
      "type": "EKSEKUTIF"
    }
  },
  "customer": {
    "id": "customer-001",
    "name": "Jane Smith",
    "phone": "081234567891"
  },
  "admin": null,
  "passengers": [
    {
      "id": "passenger-001",
      "ticketId": "ticket-001",
      "name": "Jane Smith",
      "identityNumber": "1234567890123456",
      "phone": "081234567891",
      "seatNumber": "A1",
      "createdAt": "2025-01-10T09:00:00.000Z",
      "updatedAt": "2025-01-10T09:00:00.000Z"
    },
    {
      "id": "passenger-002",
      "ticketId": "ticket-001",
      "name": "John Doe",
      "identityNumber": "6543210987654321",
      "phone": "081234567892",
      "seatNumber": "A2",
      "createdAt": "2025-01-10T09:00:00.000Z",
      "updatedAt": "2025-01-10T09:00:00.000Z"
    }
  ]
}
```

#### GET /api/v1/tickets?page=1&limit=10&status=CONFIRMED
**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "ticket-001",
      "ticketNumber": "TKT-20250110-00001",
      "scheduleId": "schedule-001",
      "customerId": "customer-001",
      "adminId": null,
      "bookingSource": "CUSTOMER_APP",
      "pickupAddress": "Jl. Gatot Subroto No. 789, Jakarta",
      "dropoffAddress": "Jl. Asia Afrika No. 321, Bandung",
      "totalPassengers": 2,
      "totalPrice": 240000,
      "status": "CONFIRMED",
      "bookingDate": "2025-01-10T09:00:00.000Z",
      "paymentDate": "2025-01-10T10:00:00.000Z",
      "notes": "Please call 30 minutes before pickup",
      "createdAt": "2025-01-10T09:00:00.000Z",
      "updatedAt": "2025-01-10T10:00:00.000Z",
      "schedule": {
        "id": "schedule-001",
        "departureTime": "2025-01-15T08:00:00.000Z",
        "route": {
          "id": "route-001",
          "routeCode": "JKT-BDG-001",
          "origin": "Jakarta",
          "destination": "Bandung"
        },
        "vehicle": {
          "id": "vehicle-001",
          "vehicleNumber": "B 1234 ABC",
          "type": "EKSEKUTIF"
        }
      },
      "customer": {
        "id": "customer-001",
        "name": "Jane Smith",
        "phone": "081234567891"
      },
      "admin": null,
      "_count": {
        "passengers": 2
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### GET /api/v1/tickets/{id}
**Response (200 OK):**
```json
{
  "id": "ticket-001",
  "ticketNumber": "TKT-20250110-00001",
  "scheduleId": "schedule-001",
  "customerId": "customer-001",
  "adminId": null,
  "bookingSource": "CUSTOMER_APP",
  "pickupAddress": "Jl. Gatot Subroto No. 789, Jakarta",
  "dropoffAddress": "Jl. Asia Afrika No. 321, Bandung",
  "totalPassengers": 2,
  "totalPrice": 240000,
  "status": "CONFIRMED",
  "bookingDate": "2025-01-10T09:00:00.000Z",
  "paymentDate": "2025-01-10T10:00:00.000Z",
  "notes": "Please call 30 minutes before pickup",
  "cancelledAt": null,
  "cancelledBy": null,
  "cancelReason": null,
  "createdAt": "2025-01-10T09:00:00.000Z",
  "updatedAt": "2025-01-10T10:00:00.000Z",
  "schedule": {
    "id": "schedule-001",
    "routeId": "route-001",
    "vehicleId": "vehicle-001",
    "driverId": "driver-001",
    "departureTime": "2025-01-15T08:00:00.000Z",
    "arrivalTime": "2025-01-15T11:00:00.000Z",
    "price": 120000,
    "status": "SCHEDULED",
    "route": {
      "id": "route-001",
      "routeCode": "JKT-BDG-001",
      "origin": "Jakarta",
      "destination": "Bandung",
      "distance": 150,
      "estimatedDuration": 180
    },
    "vehicle": {
      "id": "vehicle-001",
      "vehicleNumber": "B 1234 ABC",
      "type": "EKSEKUTIF",
      "brand": "Mercedes-Benz",
      "model": "Sprinter",
      "capacity": 16
    },
    "driver": {
      "id": "driver-001",
      "name": "Ahmad Supardi",
      "phone": "081234567890",
      "licenseNumber": "1234567890"
    }
  },
  "customer": {
    "id": "customer-001",
    "name": "Jane Smith",
    "phone": "081234567891",
    "address": "Jl. Gatot Subroto No. 789, Jakarta"
  },
  "admin": null,
  "passengers": [
    {
      "id": "passenger-001",
      "ticketId": "ticket-001",
      "name": "Jane Smith",
      "identityNumber": "1234567890123456",
      "phone": "081234567891",
      "seatNumber": "A1",
      "createdAt": "2025-01-10T09:00:00.000Z",
      "updatedAt": "2025-01-10T09:00:00.000Z"
    },
    {
      "id": "passenger-002",
      "ticketId": "ticket-001",
      "name": "John Doe",
      "identityNumber": "6543210987654321",
      "phone": "081234567892",
      "seatNumber": "A2",
      "createdAt": "2025-01-10T09:00:00.000Z",
      "updatedAt": "2025-01-10T09:00:00.000Z"
    }
  ]
}
```

#### PATCH /api/v1/tickets/{id}/confirm
**Response (200 OK):**
```json
{
  "id": "ticket-001",
  "ticketNumber": "TKT-20250110-00001",
  "status": "CONFIRMED",
  "paymentDate": "2025-01-10T10:00:00.000Z",
  "schedule": {
    "id": "schedule-001",
    "departureTime": "2025-01-15T08:00:00.000Z",
    "route": {
      "routeCode": "JKT-BDG-001",
      "origin": "Jakarta",
      "destination": "Bandung"
    },
    "vehicle": {
      "vehicleNumber": "B 1234 ABC",
      "type": "EKSEKUTIF"
    }
  },
  "passengers": [
    {
      "name": "Jane Smith",
      "seatNumber": "A1"
    },
    {
      "name": "John Doe",
      "seatNumber": "A2"
    }
  ]
}
```

---

### 📄 Travel Documents

#### POST /api/v1/travel-documents
**Request:**
```json
{
  "scheduleId": "schedule-001",
  "vehicleId": "vehicle-001",
  "driverName": "Ahmad Supardi",
  "driverPhone": "081234567890",
  "totalPassengers": 12,
  "departureDate": "2025-01-15T08:00:00Z",
  "notes": "Check all safety equipment"
}
```

**Response (201 Created):**
```json
{
  "id": "doc-001",
  "documentNumber": "SJ-20250110-00001",
  "scheduleId": "schedule-001",
  "vehicleId": "vehicle-001",
  "adminId": "admin-001",
  "driverName": "Ahmad Supardi",
  "driverPhone": "081234567890",
  "totalPassengers": 12,
  "departureDate": "2025-01-15T08:00:00.000Z",
  "status": "DRAFT",
  "issuedAt": null,
  "notes": "Check all safety equipment",
  "cancelledAt": null,
  "cancelledBy": null,
  "cancelReason": null,
  "createdAt": "2025-01-10T09:00:00.000Z",
  "updatedAt": "2025-01-10T09:00:00.000Z"
}
```

#### PATCH /api/v1/travel-documents/{id}/issue
**Response (200 OK):**
```json
{
  "id": "doc-001",
  "documentNumber": "SJ-20250110-00001",
  "scheduleId": "schedule-001",
  "vehicleId": "vehicle-001",
  "adminId": "admin-001",
  "driverName": "Ahmad Supardi",
  "driverPhone": "081234567890",
  "totalPassengers": 12,
  "departureDate": "2025-01-15T08:00:00.000Z",
  "status": "ISSUED",
  "issuedAt": "2025-01-10T09:30:00.000Z",
  "notes": "Check all safety equipment",
  "createdAt": "2025-01-10T09:00:00.000Z",
  "updatedAt": "2025-01-10T09:30:00.000Z",
  "schedule": {
    "id": "schedule-001",
    "departureTime": "2025-01-15T08:00:00.000Z",
    "route": {
      "routeCode": "JKT-BDG-001",
      "origin": "Jakarta",
      "destination": "Bandung"
    }
  },
  "vehicle": {
    "vehicleNumber": "B 1234 ABC",
    "type": "EKSEKUTIF"
  },
  "admin": {
    "name": "John Admin",
    "phone": "081234567893"
  }
}
```

**Note:** 10,000 coins automatically deducted from admin balance.

#### GET /api/v1/travel-documents/{id}/print
**Response (200 OK):**
- Content-Type: `application/pdf`
- Binary PDF file download

---

### 🚗 Driver Panel

#### GET /api/v1/driver/profile
**Response (200 OK):**
```json
{
  "id": "driver-001",
  "userId": "user-driver-001",
  "name": "Ahmad Supardi",
  "phone": "081234567890",
  "licenseNumber": "1234567890",
  "address": "Jl. Driver Street No. 123",
  "status": "AVAILABLE",
  "createdAt": "2025-01-01T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z",
  "user": {
    "id": "user-driver-001",
    "email": "driver@example.com",
    "role": "DRIVER",
    "status": "ACTIVE"
  },
  "_count": {
    "schedules": 15,
    "tripLogs": 87
  }
}
```

#### GET /api/v1/driver/trips?status=SCHEDULED
**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "schedule-001",
      "departureTime": "2025-01-15T08:00:00.000Z",
      "arrivalTime": "2025-01-15T11:00:00.000Z",
      "status": "SCHEDULED",
      "availableSeats": 14,
      "route": {
        "routeCode": "JKT-BDG-001",
        "origin": "Jakarta",
        "destination": "Bandung",
        "distance": 150,
        "estimatedDuration": 180
      },
      "vehicle": {
        "vehicleNumber": "B 1234 ABC",
        "type": "EKSEKUTIF",
        "capacity": 16
      },
      "_count": {
        "tickets": 2
      }
    }
  ],
  "total": 1
}
```

#### GET /api/v1/driver/trips/{scheduleId}/passengers
**Response (200 OK):**
```json
{
  "schedule": {
    "id": "schedule-001",
    "departureTime": "2025-01-15T08:00:00.000Z",
    "route": {
      "routeCode": "JKT-BDG-001",
      "origin": "Jakarta",
      "destination": "Bandung"
    },
    "vehicle": {
      "vehicleNumber": "B 1234 ABC",
      "type": "EKSEKUTIF"
    }
  },
  "passengers": [
    {
      "passengerId": "passenger-001",
      "passengerName": "Jane Smith",
      "identityNumber": "1234567890123456",
      "phone": "081234567891",
      "seatNumber": "A1",
      "ticketNumber": "TKT-20250110-00001",
      "ticketStatus": "CONFIRMED",
      "pickupAddress": "Jl. Gatot Subroto No. 789, Jakarta",
      "dropoffAddress": "Jl. Asia Afrika No. 321, Bandung",
      "customerName": "Jane Smith",
      "customerPhone": "081234567891"
    },
    {
      "passengerId": "passenger-002",
      "passengerName": "John Doe",
      "identityNumber": "6543210987654321",
      "phone": "081234567892",
      "seatNumber": "A2",
      "ticketNumber": "TKT-20250110-00001",
      "ticketStatus": "CONFIRMED",
      "pickupAddress": "Jl. Gatot Subroto No. 789, Jakarta",
      "dropoffAddress": "Jl. Asia Afrika No. 321, Bandung",
      "customerName": "Jane Smith",
      "customerPhone": "081234567891"
    }
  ],
  "summary": {
    "totalTickets": 1,
    "totalPassengers": 2
  }
}
```

#### POST /api/v1/driver/trips/{scheduleId}/status
**Request:**
```json
{
  "status": "DEPARTED",
  "location": "Terminal Jakarta",
  "latitude": -6.200000,
  "longitude": 106.816666,
  "notes": "Trip started on time, all passengers on board"
}
```

**Response (200 OK):**
```json
{
  "tripLog": {
    "id": "log-001",
    "scheduleId": "schedule-001",
    "driverId": "driver-001",
    "status": "DEPARTED",
    "location": "Terminal Jakarta",
    "latitude": -6.200000,
    "longitude": 106.816666,
    "notes": "Trip started on time, all passengers on board",
    "timestamp": "2025-01-15T08:05:00.000Z"
  },
  "schedule": {
    "id": "schedule-001",
    "status": "DEPARTED"
  }
}
```

---

## 🚨 Error Handling Details

### HTTP Status Codes

| Code | Description | When It Occurs |
|------|-------------|----------------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation failed, business rule violation |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions for role |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, scheduling conflict |
| 500 | Internal Server Error | Server-side error |

### Common Error Scenarios

#### Insufficient Balance
```json
{
  "statusCode": 400,
  "message": "Insufficient coin balance. Required: 20000, Current: 15000",
  "error": "Bad Request"
}
```

#### Seat Already Taken
```json
{
  "statusCode": 400,
  "message": "Seat(s) already taken: A1, A2",
  "error": "Bad Request"
}
```

#### Vehicle Conflict
```json
{
  "statusCode": 409,
  "message": "Vehicle is already scheduled for another trip (JKT-BDG-001) from 2025-01-15T08:00:00.000Z to 2025-01-15T11:00:00.000Z",
  "error": "Conflict"
}
```

#### Driver Not Available
```json
{
  "statusCode": 409,
  "message": "Driver is already assigned to another schedule (JKT-SBY-002) from 2025-01-15T07:00:00.000Z to 2025-01-15T14:00:00.000Z",
  "error": "Conflict"
}
```

#### Forbidden Access
```json
{
  "statusCode": 403,
  "message": "You can only view your own tickets",
  "error": "Forbidden"
}
```

#### Not Found
```json
{
  "statusCode": 404,
  "message": "Schedule not found",
  "error": "Not Found"
}
```

---

## 🔍 Query Parameters & Pagination

### Pagination Parameters (Available on all list endpoints)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (starts from 1) |
| `limit` | number | 10 | Items per page (max: 100) |

### Schedule Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `routeId` | string | Filter by route | `?routeId=route-001` |
| `vehicleId` | string | Filter by vehicle | `?vehicleId=vehicle-001` |
| `driverId` | string | Filter by driver | `?driverId=driver-001` |
| `status` | enum | Filter by status | `?status=SCHEDULED` |
| `origin` | string | Search by origin city | `?origin=Jakarta` |
| `destination` | string | Search by destination | `?destination=Bandung` |
| `dateFrom` | ISO 8601 | Start date filter | `?dateFrom=2025-01-15T00:00:00Z` |
| `dateTo` | ISO 8601 | End date filter | `?dateTo=2025-01-20T23:59:59Z` |
| `sortBy` | enum | Sort schedules | `?sortBy=cheapest` |

#### Sort Options (`sortBy` parameter)

| Value | Description | Sort Order |
|-------|-------------|------------|
| `nearest` | Terdekat (default) | Departure time ascending |
| `farthest` | Terjauh | Departure time descending |
| `cheapest` | Termurah | Price ascending |
| `expensive` | Termahal | Price descending |

**Examples:**
```bash
# Get cheapest schedules
GET /api/v1/schedules?sortBy=cheapest

# Get nearest departures to Bandung
GET /api/v1/schedules?destination=Bandung&sortBy=nearest

# Get most expensive schedules from Jakarta
GET /api/v1/schedules?origin=Jakarta&sortBy=expensive&limit=10
```

### Ticket Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `scheduleId` | string | Filter by schedule | `?scheduleId=schedule-001` |
| `customerId` | string | Filter by customer | `?customerId=customer-001` |
| `adminId` | string | Filter by admin | `?adminId=admin-001` |
| `status` | enum | Filter by status | `?status=CONFIRMED` |
| `bookingSource` | enum | Filter by source | `?bookingSource=CUSTOMER_APP` |
| `search` | string | Search ticket/passenger | `?search=TKT-20250110` |
| `dateFrom` | ISO 8601 | Booking date from | `?dateFrom=2025-01-10T00:00:00Z` |
| `dateTo` | ISO 8601 | Booking date to | `?dateTo=2025-01-15T23:59:59Z` |

### Route Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `origin` | string | Filter by origin | `?origin=Jakarta` |
| `destination` | string | Filter by destination | `?destination=Bandung` |
| `isActive` | boolean | Filter active routes | `?isActive=true` |
| `search` | string | Search route code/cities | `?search=JKT` |

### Vehicle Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `type` | enum | Filter by type | `?type=EKSEKUTIF` |
| `status` | enum | Filter by status | `?status=AVAILABLE` |
| `search` | string | Search vehicle number | `?search=B 1234` |

### Coin Request Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | enum | Filter by status | `?status=PENDING` |
| `adminId` | string | Filter by admin | `?adminId=admin-001` |

### Coin Transaction Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `type` | enum | Filter by type | `?type=DEDUCTION` |
| `reason` | enum | Filter by reason | `?reason=TICKET_BOOKING` |
| `dateFrom` | ISO 8601 | Date from | `?dateFrom=2025-01-01T00:00:00Z` |
| `dateTo` | ISO 8601 | Date to | `?dateTo=2025-01-31T23:59:59Z` |

### Example Combined Query
```bash
GET /api/v1/tickets?status=CONFIRMED&page=2&limit=20&dateFrom=2025-01-01T00:00:00Z&dateTo=2025-01-31T23:59:59Z&search=John
```

---

## 📱 Integration Examples

### cURL
```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123"}'

# Get schedules
curl -X GET http://localhost:3001/api/v1/schedules \
  -H "Authorization: Bearer <token>"
```

### JavaScript/Fetch
```javascript
// Login
const response = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'Admin123'
  })
});
const { access_token } = await response.json();

// Use token
const schedules = await fetch('http://localhost:3001/api/v1/schedules', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

### Python
```python
import requests

# Login
response = requests.post('http://localhost:3001/api/v1/auth/login',
    json={'email': 'admin@example.com', 'password': 'Admin123'})
token = response.json()['access_token']

# Use token
headers = {'Authorization': f'Bearer {token}'}
schedules = requests.get('http://localhost:3001/api/v1/schedules', headers=headers)
```

## 🛠️ Development

### Start Server
```bash
npm run start:dev
```

### Access Swagger UI
```
http://localhost:3001/api/docs
```

### Generate OpenAPI JSON
The OpenAPI specification is automatically generated and available at:
```
http://localhost:3001/api/docs-json
```

## 📝 Notes

1. **Date Format**: All dates use ISO 8601 format (e.g., `2025-01-10T08:00:00Z`)
2. **Indonesian Phone Format**: `^(\+62|62|0)[0-9]{9,12}$`
3. **NIK Format**: 16-digit number
4. **Route Code Format**: `ORIGIN-DESTINATION-NUMBER` (e.g., `JKT-BDG-001`)
5. **Vehicle Number Format**: Indonesian license plate (e.g., `B 1234 ABC`)
6. **Ticket Number Format**: `TKT-YYYYMMDD-XXXXX`
7. **Document Number Format**: `SJ-YYYYMMDD-XXXXX`

## 🐛 Common Issues

### 401 Unauthorized
- Token expired or invalid
- Solution: Login again to get new token

### 403 Forbidden
- Insufficient role permissions
- Solution: Check if your role has access to this endpoint

### 409 Conflict
- Resource already exists (duplicate)
- Vehicle/driver scheduling conflict
- Solution: Use different identifier or check availability

### 400 Bad Request
- Validation failed
- Insufficient balance/seats
- Solution: Check request body format and business rules

## 📞 Support

For issues or questions:
- Email: support@travelapp.com
- GitHub: https://github.com/your-repo

## 📄 License

MIT License
