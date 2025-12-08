# Payng Backend - Next Steps Guide

**Status:** 60% Complete | **Priority:** Complete Core Business Logic  
**Target:** Production-ready MVP in 5-7 days

---

## 🚀 Quick Start for Remaining Modules

### Current State
- ✅ **Infrastructure:** 100% Complete
- ✅ **Authentication:** 100% Complete  
- ✅ **School Management:** 100% Complete
- 🔨 **Student Management:** 10% Complete
- ❌ **Fee Management:** 0% Complete
- ❌ **Payment Processing:** 0% Complete
- ❌ **Receipt Generation:** 0% Complete

---

## 📋 Implementation Order (Priority)

### 1. Complete Student Module (2-4 hours)

**File Structure:**
```
src/modules/student/
├── validators.ts    ⏳ Create
├── service.ts       ⏳ Create
├── routes.ts        ⏳ Create
└── types.ts         ⏳ Optional
```

**Key Functions to Implement:**
- `createStudent()` - Create student profile
- `getStudents()` - List with pagination/filtering
- `getStudentById()` - Get single student
- `updateStudent()` - Update student info
- `getMyChildren()` - Parent's children (RBAC)
- `assignParent()` - Link parent to student
- `assignClass()` - Assign student to class

**Copy Pattern From:** School module
**Mount Route In:** `src/app.ts` - `app.route('/api/students', studentRoutes)`

**Validator Example:**
```typescript
export const createStudentSchema = z.object({
  studentId: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']),
  classId: z.number().int().positive().optional(),
  parentEmails: z.array(z.string().email()),
});
```

---

### 2. Implement Fee Management Module (4-6 hours)

**File Structure:**
```
src/modules/fee/
├── validators.ts    ⏳ Create
├── service.ts       ⏳ Create
└── routes.ts        ⏳ Create
```

**Key Functions:**

**Fee Schedules:**
- `createFeeSchedule()` - Define fee template
- `getFeeSchedules()` - List schedules
- `updateFeeSchedule()` - Modify schedule
- `deleteFeeSchedule()` - Remove schedule

**Fee Assignments:**
- `assignFeesToStudent()` - Single assignment
- `bulkAssignFees()` - Assign to multiple students
- `getStudentFees()` - Get student's fees
- `updateAssignment()` - Apply discounts
- `waiveFee()` - Waive fee for student

**Critical Logic:**
```typescript
// Bulk assignment based on class/level
async bulkAssignFees(feeScheduleId: number, filters: {
  classIds?: number[]
  levels?: string[]
  allStudents?: boolean
}) {
  // 1. Get fee schedule
  // 2. Find matching students
  // 3. Create fee assignments
  // 4. Calculate amounts (with discounts)
  // 5. Return summary
}
```

**Mount Route:** `app.route('/api/fees', feeRoutes)`

---

### 3. Build Payment Processing Module (6-8 hours)

**File Structure:**
```
src/modules/payment/
├── validators.ts    ⏳ Create
├── service.ts       ⏳ Create
└── routes.ts        ⏳ Create
```

**Critical Implementation:**

**1. Payment Initiation:**
```typescript
async initiatePayment(input: {
  studentId: number
  assignmentIds: number[]
  amount: number
  method: PaymentMethod
  email: string
}) {
  // 1. Validate student & parent relationship
  // 2. Validate fee assignments
  // 3. Calculate total due
  // 4. Create payment record (status: pending)
  // 5. Initialize with payment gateway (Arca/Flutterwave)
  // 6. Return payment URL
}
```

**2. Webhook Handler:**
```typescript
async handleWebhook(
  gateway: 'arca' | 'flutterwave',
  payload: any,
  signature: string
) {
  // 1. Verify signature
  // 2. Extract payment reference
  // 3. Find payment record
  // 4. Verify with gateway
  // 5. Update payment status
  // 6. Update fee assignments
  // 7. Generate receipt
  // 8. Send notifications
}
```

**3. Payment Verification:**
```typescript
async verifyPayment(reference: string, gateway: string) {
  // 1. Get payment from database
  // 2. Verify with gateway API
  // 3. Update payment status
  // 4. If successful:
  //    - Update fee assignments
  //    - Generate receipt
  //    - Send notifications
}
```

**Gateway Integration Already Done:**
- ✅ `src/utils/payment.ts` - Arca & Flutterwave services
- ✅ Fallback logic implemented
- ✅ Webhook verification ready

**Mount Route:** `app.route('/api/payments', paymentRoutes)`

**Add Webhook Routes in app.ts:**
```typescript
app.post('/webhooks/arca', async (c) => {
  const signature = c.req.header('x-arca-signature')
  const body = await c.req.text()
  return await paymentService.handleArcaWebhook(body, signature)
})
```

---

### 4. Complete Receipt Generation (2-3 hours)

**File Structure:**
```
src/modules/receipt/
├── service.ts       ⏳ Create
└── routes.ts        ⏳ Create
```

**Key Functions:**
```typescript
async generateReceipt(paymentId: number) {
  // 1. Get payment details
  // 2. Get student & school info
  // 3. Get fee items paid
  // 4. Generate PDF (util already exists)
  // 5. Save receipt record
  // 6. Send email with PDF attachment
}

async resendReceipt(receiptId: number, email: string) {
  // 1. Get receipt record
  // 2. Get PDF (regenerate if needed)
  // 3. Send email
  // 4. Update receipt record
}
```

**PDF Generator Already Done:**
- ✅ `src/utils/pdf.ts` - Full receipt generation
- ✅ Professional template
- ✅ School branding support

**Email Service Already Done:**
- ✅ `src/utils/email.ts` - Receipt email with attachment

**Mount Route:** `app.route('/api/receipts', receiptRoutes)`

---

### 5. Add Notification System (Optional - 3-4 hours)

**File Structure:**
```
src/modules/notification/
├── service.ts       ⏳ Create
└── routes.ts        ⏳ Create
```

**Implement:**
- SMS service (Termii API)
- WhatsApp service (WhatsApp Business API)
- Notification queue processor
- Retry logic for failed notifications

**Already Available:**
- ✅ Email service (Resend)
- ✅ Notification table schema
- ✅ Email templates

---

### 6. Implement Cron Jobs (Optional - 2-3 hours)

**File Structure:**
```
src/cron/
├── paymentReminders.ts  ⏳ Create
└── feeStatusCheck.ts    ⏳ Create
```

**Payment Reminders:**
```typescript
export async function sendPaymentReminders() {
  // 1. Find overdue/upcoming due fees
  // 2. Get student & parent info
  // 3. Send email/SMS reminders
  // 4. Update notification log
}
```

**Fee Status Check:**
```typescript
export async function checkFeeStatus() {
  // 1. Find fees past due date
  // 2. Mark as overdue
  // 3. Calculate late fees
  // 4. Queue notifications
}
```

**Already Configured:**
- ✅ `vercel.json` - Cron schedule
- ✅ Cron routes in `app.ts`

---

## 🎯 MVP Implementation Plan (5-7 days)

### Day 1-2: Core CRUD Operations
- [ ] Complete Student module
- [ ] Complete Fee Schedule CRUD
- [ ] Complete Fee Assignment logic
- [ ] Test all CRUD operations

### Day 3-4: Payment Processing
- [ ] Implement payment initiation
- [ ] Implement webhook handlers
- [ ] Implement payment verification
- [ ] Connect receipt generation
- [ ] Test payment flow end-to-end

### Day 5: Testing & Fixes
- [ ] Write unit tests for critical functions
- [ ] Integration tests for payment flow
- [ ] Fix bugs and edge cases
- [ ] Test with real gateways (sandbox)

### Day 6-7: Polish & Deploy
- [ ] Add remaining admin endpoints
- [ ] Implement basic dashboard stats
- [ ] Add notification system (if time permits)
- [ ] Deploy to Vercel
- [ ] Production testing

---

## 📝 Code Templates

### Service Layer Template
```typescript
import { db } from '@/core/db'
import { tableName } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { CreateInput, UpdateInput } from './validators'

export class ServiceName {
  async create(input: CreateInput) {
    // Validation logic
    // Database insert
    // Return formatted response
  }

  async getAll(query: QueryInput) {
    // Build where clause
    // Get count for pagination
    // Fetch data
    // Return with pagination
  }

  async getById(id: number) {
    // Find by ID
    // Throw error if not found
    // Return data
  }

  async update(id: number, input: UpdateInput) {
    // Check exists
    // Validate update
    // Update database
    // Return updated data
  }

  async delete(id: number) {
    // Check exists
    // Soft delete (set isActive: false)
    // Return success message
  }
}
```

### Route Template
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { schemas } from './validators'
import { Service } from './service'
import { authMiddleware } from '@/middlewares/auth'
import { rbacMiddleware } from '@/middlewares/rbac'

const router = new Hono()
const service = new Service()

router.use('*', authMiddleware)

router.post('/',
  rbacMiddleware(['admin']),
  zValidator('json', schemas.create),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const result = await service.create(body)
      return c.json({ success: true, data: result }, 201)
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 400)
    }
  }
)

// ... more routes

export default router
```

---

## 🧪 Testing Strategy

### Unit Tests
```bash
# Test file: src/modules/payment/service.test.ts
bun test src/modules/payment/service.test.ts
```

**What to Test:**
- Payment initiation validation
- Amount calculation
- Gateway selection logic
- Webhook signature verification
- Fee assignment updates

### Integration Tests
```bash
# Test complete flows
bun test tests/integration/payment-flow.test.ts
```

**Critical Flows to Test:**
1. User registration → Student creation → Fee assignment → Payment → Receipt
2. Payment webhook → Status update → Receipt generation → Email delivery
3. Bulk fee assignment → Multiple students → Discount application

### Manual Testing Checklist
- [ ] Create school via API
- [ ] Create school admin
- [ ] School admin creates students
- [ ] School admin creates fee schedules
- [ ] School admin assigns fees to students
- [ ] Parent views child's fees
- [ ] Parent initiates payment
- [ ] Webhook processes payment
- [ ] Receipt generated and emailed
- [ ] Payment history visible

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module"
**Solution:** Check import paths use `@/` alias, ensure tsconfig.json paths configured

### Issue: "Database connection failed"
**Solution:** Check DATABASE_URL in .env, ensure PostgreSQL running

### Issue: "Rate limit exceeded"
**Solution:** Rate limiter uses memory store, resets on restart

### Issue: "Payment gateway error"
**Solution:** Check API keys, use sandbox URLs for testing

### Issue: "Email not sent"
**Solution:** Check RESEND_API_KEY, verify email domain if in production

---

## 📊 Progress Tracking

Use this checklist to track your progress:

### Student Module
- [ ] validators.ts created
- [ ] service.ts created
- [ ] routes.ts created
- [ ] Mounted in app.ts
- [ ] Basic CRUD tested
- [ ] Parent relationship working

### Fee Module
- [ ] validators.ts created
- [ ] service.ts created
- [ ] routes.ts created
- [ ] Fee schedule CRUD working
- [ ] Fee assignment working
- [ ] Bulk assignment working
- [ ] Discount logic implemented

### Payment Module
- [ ] validators.ts created
- [ ] service.ts created
- [ ] routes.ts created
- [ ] Payment initiation working
- [ ] Arca integration tested
- [ ] Flutterwave fallback working
- [ ] Webhook handler implemented
- [ ] Payment verification working
- [ ] Receipt auto-generation working

### Receipt Module
- [ ] service.ts created
- [ ] routes.ts created
- [ ] PDF generation working
- [ ] Email delivery working
- [ ] Resend functionality working

### Testing
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Manual testing completed
- [ ] Edge cases handled

### Deployment
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Production database seeded
- [ ] Deployed to Vercel
- [ ] Production testing completed

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All critical modules implemented
- [ ] Tests passing
- [ ] Database migrations ready
- [ ] Environment variables documented
- [ ] Error handling comprehensive
- [ ] Rate limiting configured
- [ ] Security headers enabled

### Vercel Setup
1. **Connect GitHub Repository**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to vercel.com
   - Import project
   - Select payng-backend repo

3. **Configure Environment Variables**
   - Copy all from env.example
   - Add production values
   - DATABASE_URL → Production database
   - Payment gateway → Production keys
   - RESEND_API_KEY → Production key

4. **Set Up Database**
   - Use Vercel Postgres or Neon
   - Run migrations: `bun run db:migrate`
   - Run seed: `bun run db:seed` (optional)

5. **Deploy**
   - Vercel auto-deploys on push
   - Check build logs
   - Test health endpoint
   - Test critical flows

### Post-Deployment
- [ ] Health check working
- [ ] API endpoints responding
- [ ] Database connection working
- [ ] Authentication working
- [ ] Payment gateway working
- [ ] Email delivery working
- [ ] Webhook URLs configured in gateway dashboards
- [ ] Monitoring set up (optional: Sentry)
- [ ] Domain configured (optional)

---

## 💡 Pro Tips

1. **Copy Existing Patterns**
   - School module is your template
   - Auth module shows RBAC patterns
   - Copy validators/services structure

2. **Use Database Studio**
   ```bash
   bun run db:studio
   ```
   Visual database management

3. **Test Incrementally**
   - Test each endpoint as you build
   - Use Postman/Thunder Client
   - Save requests for regression testing

4. **Handle Errors Early**
   - Throw descriptive errors
   - Global error handler will format them
   - Add error codes for client handling

5. **Use Sample Data**
   ```bash
   bun run db:seed
   ```
   Creates test accounts and data

6. **Check Context**
   - `c.get('user')` - Current user
   - `c.get('schoolId')` - School context
   - `c.get('dbUser')` - Full user object

7. **Multi-Tenancy**
   - Always filter by schoolId
   - Check user belongs to school
   - Use RBAC middleware

---

## 📚 Reference Documentation

- **Hono Docs:** https://hono.dev
- **Drizzle ORM:** https://orm.drizzle.team
- **Lucia Auth:** https://lucia-auth.com
- **Zod Validation:** https://zod.dev
- **Bun Runtime:** https://bun.sh

---

## 🎯 Success Criteria

**MVP is Ready When:**
- ✅ All critical endpoints working
- ✅ Payment flow complete (initiate → webhook → receipt)
- ✅ Fee assignment and management working
- ✅ Student CRUD operations working
- ✅ Authentication and RBAC enforced
- ✅ Receipt generation and email delivery working
- ✅ Basic testing completed
- ✅ Deployed to Vercel
- ✅ Production tested with real payment gateway (sandbox)

---

**Good luck! You have all the tools and patterns you need. Follow the order, copy the patterns, and you'll have a production-ready API in less than a week! 🚀**