# Payng Backend API

A comprehensive, production-ready backend for Nigerian school fees payment platform built with **Hono + Bun** and deployable on **Vercel serverless functions**.

![Payng Logo](https://via.placeholder.com/150x50/2563eb/white?text=PAYNG)

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd payng-backend

# Install dependencies
bun install

# Copy environment variables
cp env.example .env

# Generate database migrations
bun run db:generate

# Run migrations (ensure DATABASE_URL is configured)
bun run db:migrate

# Seed database with sample data
bun run db:seed

# Start development server
bun run dev
```

The API will be available at `http://localhost:3000`

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Database](#database)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Payment Integration](#payment-integration)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)

## 🎯 Overview

Payng is a multi-tenant school fees management platform designed specifically for Nigerian schools. It handles:

- **Multi-tenant architecture**: One backend serves multiple schools
- **Role-based access control**: SuperAdmin, SchoolAdmin, Parent, Student
- **Payment processing**: Arca (primary) + Flutterwave (fallback)
- **Automated receipts**: PDF generation and email delivery
- **Notifications**: Email, SMS, and WhatsApp integration
- **Fee management**: Flexible fee schedules and installment plans
- **Nigerian market focus**: NGN currency, local payment gateways, 3-term academic year

## ✨ Features

### Core Features
- ✅ **Multi-school management** with data isolation
- ✅ **User authentication** with Lucia v3 and session management
- ✅ **Role-based access control** (RBAC) with 4 user roles
- ✅ **Student enrollment** and class management
- ✅ **Fee scheduling** with term-based and installment options
- ✅ **Payment processing** with dual gateway support
- ✅ **Automated receipt generation** (PDF) and delivery
- ✅ **Multi-channel notifications** (Email, SMS, WhatsApp)
- ✅ **Payment reminders** and overdue tracking
- ✅ **Admin dashboard** with reconciliation tools

### Technical Features
- ✅ **Serverless architecture** (Vercel compatible)
- ✅ **PostgreSQL** with connection pooling
- ✅ **Type-safe** with TypeScript and Drizzle ORM
- ✅ **Validation** with Zod schemas
- ✅ **Rate limiting** and security middleware
- ✅ **Error handling** with detailed logging
- ✅ **API documentation** with built-in docs endpoint

## 🛠 Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Runtime** | Bun 1.x | Fast JavaScript runtime |
| **Framework** | Hono 4.x | Lightweight web framework |
| **Database** | PostgreSQL | Primary database |
| **ORM** | Drizzle ORM 0.33.x | Type-safe database queries |
| **Authentication** | Lucia 3.2.x + Oslo 1.2.x | Session management |
| **Validation** | Zod 3.23.x | Runtime type validation |
| **Payments** | Arca + Flutterwave | Nigerian payment gateways |
| **Email** | Resend API | Email delivery service |
| **PDF** | pdf-lib | Receipt generation |
| **Deployment** | Vercel | Serverless hosting |

## 📁 Project Structure

```
payng-backend/
├── src/
│   ├── index.ts                    # Entry point (Vercel + local dev)
│   ├── app.ts                      # Hono app configuration
│   │
│   ├── core/                       # Core utilities
│   │   ├── auth.ts                 # Lucia authentication setup
│   │   ├── db.ts                   # Drizzle database connection
│   │   └── config.ts               # Environment configuration
│   │
│   ├── db/                         # Database layer
│   │   ├── schema/                 # Database schemas
│   │   │   ├── index.ts            # Export all schemas
│   │   │   ├── users.ts            # User accounts and sessions
│   │   │   ├── schools.ts          # School information
│   │   │   ├── students.ts         # Student profiles
│   │   │   ├── classes.ts          # Class management
│   │   │   ├── fees.ts             # Fee schedules and assignments
│   │   │   ├── payments.ts         # Payment transactions
│   │   │   ├── receipts.ts         # Receipt records
│   │   │   └── notifications.ts    # Notification queue
│   │   ├── migrate.ts              # Migration runner
│   │   └── seed.ts                 # Sample data seeder
│   │
│   ├── modules/                    # Feature modules
│   │   ├── auth/                   # Authentication module
│   │   │   ├── routes.ts           # Auth endpoints
│   │   │   ├── service.ts          # Auth business logic
│   │   │   └── validators.ts       # Input validation
│   │   ├── school/                 # School management (TBD)
│   │   ├── student/                # Student management (TBD)
│   │   ├── fee/                    # Fee management (TBD)
│   │   ├── payment/                # Payment processing (TBD)
│   │   └── receipt/                # Receipt generation (TBD)
│   │
│   ├── middlewares/                # Middleware functions
│   │   ├── auth.ts                 # Authentication middleware
│   │   ├── rbac.ts                 # Role-based access control
│   │   ├── errorHandler.ts         # Global error handling
│   │   └── rateLimiter.ts          # Rate limiting
│   │
│   ├── utils/                      # Utility functions
│   │   ├── email.ts                # Email service (Resend)
│   │   ├── payment.ts              # Payment gateway integrations
│   │   └── pdf.ts                  # PDF receipt generation
│   │
│   └── types/                      # TypeScript type definitions
│       └── index.ts                # Shared types and interfaces
│
├── drizzle/                        # Generated migrations
├── vercel.json                     # Vercel deployment config
├── drizzle.config.ts               # Drizzle configuration
├── env.example                     # Environment variables template
├── package.json                    # Dependencies and scripts
└── tsconfig.json                   # TypeScript configuration
```

## 🔧 Environment Setup

### Required Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/payng

# Authentication
SESSION_SECRET=your-64-character-session-secret
JWT_SECRET=your-jwt-secret-key

# Payment Gateways
ARCA_API_KEY=your-arca-api-key
ARCA_SECRET_KEY=your-arca-secret-key
ARCA_BASE_URL=https://api.arca.africa
ARCA_WEBHOOK_SECRET=your-webhook-secret

FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxxxx

# Notifications
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@payng.ng

# SMS (Termii)
SMS_API_KEY=your-termii-api-key
SMS_SENDER_ID=Payng

# WhatsApp
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_BUSINESS_ID=your-business-id

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
ENCRYPTION_KEY=your-32-character-encryption-key

# Cron Jobs
CRON_SECRET=your-vercel-cron-secret
```

### Local Development Setup

1. **Install Bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Database Setup** (PostgreSQL):
   ```bash
   # Using Docker
   docker run --name payng-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=payng -p 5432:5432 -d postgres:15

   # Or install PostgreSQL locally and create database
   createdb payng
   ```

3. **Environment Configuration**:
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

4. **Database Migration**:
   ```bash
   bun run db:generate  # Generate migrations from schema
   bun run db:migrate   # Apply migrations
   bun run db:seed      # Insert sample data
   ```

## 🗄 Database

### Schema Overview

The database uses PostgreSQL with the following main entities:

- **Users**: User accounts with role-based access
- **Schools**: Multi-tenant school information
- **Students**: Student profiles linked to schools and parents
- **Classes**: Class/grade organization
- **Fee Schedules**: Template fee definitions
- **Fee Assignments**: Individual student fee assignments
- **Payments**: Payment transaction records
- **Receipts**: Generated receipt records
- **Notifications**: Notification queue and history

### Key Relationships

```mermaid
erDiagram
    Users ||--o{ Students : "parent_user_ids"
    Schools ||--o{ Students : "school_id"
    Schools ||--o{ Classes : "school_id"
    Classes ||--o{ Students : "class_id"
    Schools ||--o{ FeeSchedules : "school_id"
    Students ||--o{ FeeAssignments : "student_id"
    FeeSchedules ||--o{ FeeAssignments : "fee_schedule_id"
    FeeAssignments ||--o{ Payments : "fee_assignments"
    Payments ||--o{ Receipts : "payment_id"
```

### Database Commands

```bash
# Generate new migration after schema changes
bun run db:generate

# Apply pending migrations
bun run db:migrate

# Open Drizzle Studio (database GUI)
bun run db:studio

# Reset database with sample data
bun run db:seed
```

## 🔐 Authentication

### Authentication Flow

The API uses **Lucia v3** for session-based authentication:

1. **Registration**: User creates account with email verification
2. **Login**: Validates credentials and creates session
3. **Session**: Lucia manages session cookies/tokens
4. **Authorization**: RBAC middleware checks user permissions

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **super_admin** | System administrator | Full system access |
| **school_admin** | School administrator | School-scoped admin access |
| **parent** | Student parent/guardian | Access to own children's data |
| **student** | Student account | Access to own academic data |

### Authentication Endpoints

```bash
POST /api/auth/register        # User registration
POST /api/auth/login          # User login
POST /api/auth/admin/login    # Admin login
POST /api/auth/logout         # User logout
GET  /api/auth/me            # Get current user
POST /api/auth/verify-email   # Email verification
POST /api/auth/forgot-password # Password reset request
POST /api/auth/reset-password  # Password reset
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Schools (Coming Soon)
- `GET /api/schools` - List schools
- `POST /api/schools` - Create school
- `GET /api/schools/:id` - Get school details
- `PATCH /api/schools/:id` - Update school

### Students (Coming Soon)
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/my-children` - Get parent's children
- `GET /api/students/:id` - Get student details

### Payments (Coming Soon)
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history/:studentId` - Payment history

### Webhooks
- `POST /webhooks/arca` - Arca payment webhook
- `POST /webhooks/flutterwave` - Flutterwave webhook

### System
- `GET /health` - System health check
- `GET /health/db` - Database health check
- `GET /api/docs` - API documentation

## 💳 Payment Integration

### Supported Gateways

1. **Arca Payment** (Primary)
   - Nigerian payment gateway
   - Supports card, bank transfer, USSD
   - Lower transaction fees

2. **Flutterwave** (Fallback)
   - International payment gateway
   - Backup when Arca fails
   - Wider payment method support

### Payment Flow

1. **Initiation**: User selects fees and payment method
2. **Gateway Selection**: Try Arca first, fallback to Flutterwave
3. **Redirect**: User redirected to payment gateway
4. **Callback**: Gateway redirects back with payment result
5. **Webhook**: Gateway sends payment confirmation
6. **Receipt**: PDF receipt generated and emailed

### Configuration

```javascript
// School payment configuration
{
  "arcaEnabled": true,
  "flutterwaveEnabled": true,
  "allowPartialPayment": true,
  "lateFeePercentage": 5.0
}
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**:
   ```bash
   # Push to GitHub
   git push origin main
   ```

2. **Import to Vercel**:
   - Connect GitHub repository in Vercel dashboard
   - Vercel will automatically detect the project

3. **Configure Environment Variables**:
   - Add all environment variables in Vercel dashboard
   - Ensure `DATABASE_URL` points to production database

4. **Deploy**:
   - Vercel deploys automatically on push to main branch
   - Check deployment logs for any issues

### Production Checklist

- [ ] **Database**: Set up production PostgreSQL (Vercel Postgres/Neon)
- [ ] **Environment Variables**: Configure all production values
- [ ] **Domain**: Set up custom domain (optional)
- [ ] **SSL**: Enable HTTPS (automatic with Vercel)
- [ ] **Payment Gateways**: Configure production API keys
- [ ] **Email Service**: Set up production Resend account
- [ ] **Monitoring**: Set up error tracking (Sentry recommended)
- [ ] **Backups**: Configure database backups

### Environment-Specific Configuration

```bash
# Development
DATABASE_URL=postgresql://localhost:5432/payng_dev
FRONTEND_URL=http://localhost:5173

# Production  
DATABASE_URL=postgresql://production-db-url
FRONTEND_URL=https://payng.ng
```

## 🛠 Development

### Available Scripts

```bash
# Development
bun run dev           # Start development server with watch mode
bun run start         # Start production server

# Database
bun run db:generate   # Generate migrations from schema
bun run db:migrate    # Apply pending migrations  
bun run db:push       # Push schema changes directly (dev only)
bun run db:studio     # Open database GUI
bun run db:seed       # Seed database with sample data

# Code Quality
bun run lint          # Run ESLint
bun run lint:fix      # Fix ESLint issues
bun run test          # Run tests

# Build
bun run build         # No-op for Vercel (handled automatically)
```

### Adding New Modules

1. **Create Module Directory**:
   ```bash
   mkdir src/modules/new-feature
   cd src/modules/new-feature
   ```

2. **Create Module Files**:
   ```bash
   touch routes.ts service.ts validators.ts types.ts
   ```

3. **Follow Module Pattern**:
   ```typescript
   // routes.ts - HTTP endpoints
   // service.ts - Business logic  
   // validators.ts - Zod schemas
   // types.ts - TypeScript interfaces
   ```

4. **Mount Routes**:
   ```typescript
   // src/app.ts
   import newFeatureRoutes from './modules/new-feature/routes'
   app.route('/api/new-feature', newFeatureRoutes)
   ```

### Database Schema Changes

1. **Modify Schema**:
   ```typescript
   // src/db/schema/table.ts
   export const newTable = pgTable('new_table', {
     // Define columns
   })
   ```

2. **Generate Migration**:
   ```bash
   bun run db:generate
   ```

3. **Apply Migration**:
   ```bash
   bun run db:migrate
   ```

## 🧪 Testing

### Test Structure

```bash
tests/
├── integration/      # API endpoint tests
├── unit/            # Unit tests for services
└── fixtures/        # Test data and helpers
```

### Running Tests

```bash
# Run all tests
bun run test

# Run specific test file
bun test tests/auth.test.ts

# Run tests with coverage
bun test --coverage
```

### Sample Test Data

The `bun run db:seed` command creates sample data for testing:

- **Super Admin**: `admin@payng.ng` / `SuperAdmin123!`
- **School Admin**: `admin@graceacademy.edu.ng` / `Admin123!`
- **Parent 1**: `parent1@example.com` / `Parent123!`
- **Parent 2**: `parent2@example.com` / `Parent123!`

## 📚 API Documentation

### Built-in Documentation

Visit `/api/docs` endpoint for interactive API documentation including:

- Available endpoints
- Request/response schemas
- Authentication requirements
- Error codes and examples

### Response Format

All API responses follow this standard format:

```typescript
{
  "success": boolean,
  "data": any,           // Present on success
  "error": string,       // Present on error
  "message": string,     // Optional additional info
  "code": string        // Optional error code
}
```

### Error Handling

Standard HTTP status codes are used:

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Rate Limited
- `500` - Internal Server Error

## 🤝 Contributing

### Development Workflow

1. **Fork and Clone**:
   ```bash
   git clone <your-fork-url>
   cd payng-backend
   ```

2. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**:
   - Follow existing code patterns
   - Add tests for new features
   - Update documentation

4. **Test Changes**:
   ```bash
   bun run lint
   bun run test
   bun run db:generate  # If schema changed
   ```

5. **Submit Pull Request**:
   - Clear description of changes
   - Reference any related issues
   - Ensure CI passes

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Extended recommended rules
- **Formatting**: Prettier configuration
- **Naming**: camelCase for functions, PascalCase for classes
- **Comments**: JSDoc for complex functions

### Commit Messages

Use conventional commits:

```bash
feat: add payment verification endpoint
fix: resolve authentication middleware bug
docs: update API documentation
refactor: optimize database queries
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and `/api/docs` endpoint
- **Issues**: Create GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and DATABASE_URL is correct
2. **Missing Dependencies**: Run `bun install` to install all packages
3. **Migration Errors**: Ensure database is accessible and migrations are up to date
4. **Authentication Issues**: Check session secret configuration

### Performance Tips

- **Connection Pooling**: Configured for serverless environments
- **Rate Limiting**: Prevents API abuse
- **Error Handling**: Comprehensive logging for debugging
- **Caching**: Consider adding Redis for production

---

**Built with ❤️ for Nigerian schools**

For more information, visit [payng.ng](https://payng.ng)