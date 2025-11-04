# Mobile Travel App API Documentation

## 📚 Overview

Comprehensive REST API documentation for the Mobile Travel App Backend System. The API provides complete functionality for managing a travel/transportation business including user management, booking systems, coin-based payments, and real-time trip tracking.

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

### 1. **Authentication**
- User login and JWT token generation
- Role-based access control (SUPER_ADMIN, ADMIN, DRIVER, CUSTOMER)

### 2. **User Management**
- **Admins**: Admin user CRUD operations
- **Customers**: Customer user management
- **Drivers**: Driver profile and status management

### 3. **Coin System** 💰
- **Coin Requests**: Top-up requests and approval workflow
- **Coin Transactions**: Transaction history and balance tracking
- **Auto-deduction**:
  - Ticket booking: 10,000 coins per passenger
  - Travel document: 10,000 coins per document

### 4. **Travel Operations**
- **Routes**: Travel route management
- **Vehicles**: Fleet management with status tracking
- **Schedules**: Trip scheduling with conflict detection
  - Driver/vehicle availability validation
  - Automatic seat management

### 5. **Booking System**
- **Tickets**: Passenger booking with seat selection
  - Multiple passengers per booking
  - Seat conflict prevention
  - Auto coin deduction for admin bookings
  - Cancellation with refund

### 6. **Travel Documents** 📄
- Create and issue digital travel permits (Surat Jalan)
- PDF generation with professional formatting
- Coin-based issuance (10,000 coins)
- Indonesian language format

### 7. **Driver Panel** 🚗
- Driver profile and statistics
- Assigned trips management
- Passenger boarding manifest
- Real-time trip status updates with GPS tracking

### 8. **Trip Logging**
- Complete trip audit trail
- Status changes tracking
- Location history
- Trip reports and analytics

## 🔐 Role-Based Access

| Role | Access Level | Key Permissions |
|------|-------------|-----------------|
| **SUPER_ADMIN** | Full access | All operations, approve coin requests |
| **ADMIN** | Management | Create bookings, issue documents, manage resources |
| **DRIVER** | Limited | View assigned trips, update trip status, view passengers |
| **CUSTOMER** | Basic | Book tickets, view own bookings |

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
  "availableSeats": 16
}
```

#### 2. Book Tickets for Customer
```bash
POST /api/v1/tickets
{
  "scheduleId": "schedule-uuid",
  "bookingSource": "ADMIN_PANEL",
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

#### 3. Issue Travel Document
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

#### 1. Browse Upcoming Trips
```bash
GET /api/v1/schedules/upcoming?limit=20
```

#### 2. Book Tickets
```bash
POST /api/v1/tickets
{
  "scheduleId": "schedule-uuid",
  "bookingSource": "CUSTOMER_APP",
  "passengers": [
    {
      "name": "Jane Smith",
      "phone": "081234567890",
      "seatNumber": "B2"
    }
  ]
}
```

#### 3. View My Tickets
```bash
GET /api/v1/tickets
```

## 📊 Response Formats

### Success Response
```json
{
  "data": { ... },
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
