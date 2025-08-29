# API Documentation - Barsel Event v2

## Base URLs
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication
All admin endpoints require session-based authentication.

### Login
```
POST /api/sessions
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response:
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  "message": "Login successful"
}
```

### Logout
```
DELETE /api/sessions/logout

Response:
{
  "message": "Logged out successfully"
}
```

### Check Authentication Status
```
GET /api/me

Response:
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin"
}
```

### Health Check
```
GET /api/health

Response: "OK" (Status: 200)
```

## Events API

### Public Endpoints

#### Get All Events
```
GET /api/events

Response: Array of Event objects (public view)
```

#### Get Event Details
```
GET /api/events/:id

Response: Event object with detailed information
```

#### Get Event Winners
```
GET /api/events/:id/winners

Response: Array of Winner objects with prize information
```

#### Check Registration Status
```
GET /api/events/:id/check-registration?email=user@example.com&phone=+628123456789

Response:
{
  "exists": true,
  "participant": {
    "id": 1,
    "name": "John Doe",
    "registrationNumber": "E001-0001"
  }
}
```

### Admin Endpoints (Requires Authentication)

#### Get All Events (Admin)
```
GET /api/admin/events

Response: Array of Event objects with admin information
```

#### Get Event Details (Admin)
```
GET /api/admin/events/:id

Response: Event object with complete admin data
```

#### Create Event
```
POST /api/admin/events
Content-Type: multipart/form-data

Form fields:
- name: string (required)
- description: text
- event_date: datetime (required)
- location: string
- contact_person: string
- start_time: time
- max_participants: integer (0-9999)
- category: enum (utama, reguler) (required)
- registration_start: datetime (required)
- registration_end: datetime (required)
- banner: file (PNG/JPEG, max 2MB)
```

#### Update Event
```
PUT /api/admin/events/:id
Content-Type: multipart/form-data
(Same fields as create)
```

#### Delete Event
```
DELETE /api/admin/events/:id

Response:
{
  "message": "Event deleted successfully"
}
```

## Participants API

### Public Endpoints

#### Register Participant
```
POST /api/participants
Content-Type: application/json

{
  "participant": {
    "event_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+628123456789",
    "nik": "1234567890123456",
    "institution": "Company Name"
  },
  "recaptcha_token": "recaptcha_response_token"
}

Response:
{
  "id": 1,
  "name": "John Doe",
  "registrationNumber": "E001-0001",
  "message": "Registration successful"
}
```

#### Get Participant Card Data
```
GET /api/events/:event_id/participants/:id/card_data

Response:
{
  "participant": {
    "name": "John Doe",
    "registrationNumber": "E001-0001",
    "institution": "Company Name"
  },
  "event": {
    "name": "Event Name",
    "eventDate": "2024-12-31T10:00:00Z",
    "location": "Event Location"
  }
}
```

#### Download Participant Card (PDF)
```
GET /api/events/:event_id/participants/:id/download_card

Response: PDF file download
```

### Admin Endpoints

#### Get Event Participants
```
GET /api/admin/events/:event_id/participants

Response: Array of Participant objects with admin details
```

#### Get Participant Details
```
GET /api/admin/events/:event_id/participants/:id

Response: Participant object with complete information
```

#### Create Participant (Admin)
```
POST /api/admin/events/:event_id/participants
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+628123456789",
  "nik": "1234567890123456",
  "institution": "Company Name"
}
```

#### Update Participant
```
PUT /api/admin/events/:event_id/participants/:id
Content-Type: application/json
(Same fields as create)
```

#### Delete Participant
```
DELETE /api/admin/events/:event_id/participants/:id
```

#### Export Participants
```
GET /api/admin/events/:event_id/participants/export?format=xlsx

Response: Excel file download
```

## Prizes API

### Admin Endpoints

#### Get Event Prizes
```
GET /api/admin/events/:event_id/prizes

Response: Array of Prize objects
```

#### Get Prize Details
```
GET /api/admin/events/:event_id/prizes/:id

Response: Prize object with drawing information
```

#### Create Prize
```
POST /api/admin/events/:event_id/prizes
Content-Type: multipart/form-data

Form fields:
- name: string (required)
- category: enum (utama, reguler) (required)
- quantity: integer (required, >= 1)
- description: text
- image: file (PNG/JPEG, max 2MB)
```

#### Update Prize
```
PUT /api/admin/events/:event_id/prizes/:id
Content-Type: multipart/form-data
(Same fields as create)
```

#### Delete Prize
```
DELETE /api/admin/events/:event_id/prizes/:id
```

## Prize Drawing API

### Admin Endpoints

#### Get Drawing Statistics
```
GET /api/admin/events/:event_id/prize_drawings/statistics

Response:
{
  "totalPrizes": 10,
  "drawnPrizes": 3,
  "remainingPrizes": 7,
  "totalParticipants": 50
}
```

#### Get Eligible Participants
```
GET /api/admin/events/:event_id/prize_drawings/:prize_id/eligible_participants

Response: Array of eligible Participant objects
```

#### Draw Prize
```
POST /api/admin/events/:event_id/prize_drawings/:prize_id/draw

Response:
{
  "success": true,
  "winner": {
    "id": 1,
    "name": "John Doe",
    "registrationNumber": "E001-0001"
  },
  "prize": {
    "id": 1,
    "name": "Grand Prize",
    "category": "utama"
  },
  "winning": {
    "id": 1,
    "drawnAt": "2024-01-01T12:00:00Z"
  }
}
```

#### Reset Prize Draw
```
POST /api/admin/events/:event_id/prize_drawings/:prize_id/reset

Response:
{
  "message": "Prize draw reset successfully",
  "prize": {
    "id": 1,
    "name": "Grand Prize",
    "remainingQuantity": 1
  }
}
```

## Dashboard API

### Admin Endpoints

#### Get Dashboard Statistics
```
GET /api/dashboard/stats

Response:
{
  "totalEvents": 5,
  "totalParticipants": 250,
  "totalPrizes": 50,
  "totalWinnings": 15,
  "recentEvents": [...],
  "upcomingEvents": [...]
}
```

#### Real-time Events Stream (Server-Sent Events)
```
GET /api/dashboard/events
Accept: text/event-stream

Response: SSE stream with real-time event updates
```

## Admin Management API

### Admin Endpoints

#### Get All Admins
```
GET /api/admin/admins

Response: Array of Admin objects
```

#### Get Admin Profile
```
GET /api/admin/profile

Response: Current admin profile information
```

#### Update Admin Profile
```
PUT /api/admin/profile
Content-Type: multipart/form-data

Form fields:
- name: string
- email: string
- password: string (optional)
- avatar: file (optional)
```

#### Create Admin
```
POST /api/admin/admins
Content-Type: application/json

{
  "name": "New Admin",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

#### Update Admin
```
PUT /api/admin/admins/:id
Content-Type: application/json
(Same fields as create, password optional)
```

#### Delete Admin
```
DELETE /api/admin/admins/:id
```

## Audit Logs API

### Admin Endpoints

#### Get Audit Logs
```
GET /api/audit_logs?page=1&per_page=20&action=create&model=Event

Response:
{
  "audit_logs": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 100
  }
}
```

#### Get Audit Log Details
```
GET /api/audit_logs/:id

Response: Detailed audit log information
```

## Image Serving API

### Public Endpoint

#### Get Image
```
GET /api/images/:signed_id/:filename?size=medium&variant=thumb

Response: Image file with appropriate caching headers
```

## Data Models

### Event Object
```json
{
  "id": 1,
  "name": "Annual Conference 2024",
  "description": "Annual company conference",
  "eventDate": "2024-12-31T10:00:00Z",
  "location": "Jakarta Convention Center",
  "contactPerson": "John Doe (+628123456789)",
  "startTime": "09:00:00",
  "maxParticipants": 100,
  "category": "utama",
  "sequenceNumber": 1,
  "registrationStatus": "Pendaftaran dibuka",
  "participantsCount": 25,
  "availableSlots": 75,
  "registrationStart": "2024-01-01T00:00:00Z",
  "registrationEnd": "2024-12-30T23:59:59Z",
  "bannerUrl": "http://localhost:3000/api/images/...",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "creator": {
    "id": 1,
    "name": "Admin User"
  }
}
```

### Participant Object
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+628123456789",
  "nik": "1234567890123456",
  "institution": "Company Name",
  "registrationNumber": "E001-0001",
  "winner": false,
  "forfeited": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Prize Object
```json
{
  "id": 1,
  "name": "Grand Prize",
  "description": "Main prize for the event",
  "category": "utama",
  "quantity": 1,
  "remainingQuantity": 0,
  "winnersCount": 1,
  "drawn": true,
  "imageUrl": "http://localhost:3000/api/images/...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Winning Object
```json
{
  "id": 1,
  "participant": {
    "id": 1,
    "name": "John Doe",
    "registrationNumber": "E001-0001"
  },
  "prize": {
    "id": 1,
    "name": "Grand Prize",
    "category": "utama"
  },
  "drawnAt": "2024-01-01T12:00:00Z"
}
```

### Admin Object
```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin",
  "avatarUrl": "http://localhost:3000/api/images/...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Error Response Formats

### Standard Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### Validation Error Response
```json
{
  "error": "Validation failed",
  "errors": ["Field can't be blank", "Field is invalid"],
  "fieldErrors": {
    "email": ["can't be blank", "is invalid"],
    "phoneNumber": ["has already been taken"]
  }
}
```

### Authentication Error Response
```json
{
  "error": "Authentication required",
  "message": "Please log in to access this resource"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (for delete operations)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

## Rate Limiting

All API endpoints implement basic rate limiting:
- **Public endpoints**: 100 requests per minute per IP
- **Admin endpoints**: 300 requests per minute per authenticated user
- **File uploads**: 10 requests per minute per user

## File Upload Specifications

### Supported Image Formats
- **Event Banners**: PNG, JPEG (max 2MB)
- **Prize Images**: PNG, JPEG (max 2MB)
- **Admin Avatars**: PNG, JPEG (max 1MB)

### Image Processing
- Automatic resizing and optimization
- Multiple variants generated (thumb, small, medium, large)
- CDN-ready URLs with proper caching headers
