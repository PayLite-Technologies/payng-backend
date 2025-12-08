# Payng Backend - Testing Guide

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** Production Ready for MVP Testing

---

## 🧪 Quick Start Testing

### Prerequisites
```bash
# Ensure server is running
bun run dev

# Server should be available at:
http://localhost:3000

# Check health
curl http://localhost:3000/health
```

---

## 📋 Test Credentials

### Super Admin
```
Email: admin@payng.ng
Password: SuperAdmin123!
Role: super_admin
```

### School Admin
```
Email: admin@graceacademy.edu.ng
Password: Admin123!
Role: school_admin
School: Grace Academy (ID: 1)
```

### Parent 1
```
Email: parent1@example.com
Password: Parent123!
Role: parent
Children: 2 students (Sarah & Michael Johnson)
```

### Parent 2
```
Email: parent2@example.com
Password: Parent123!
Role: parent
Children: 1 student (Grace Okafor)
```

---

## 🔐 Authentication Tests

### 1. User Registration

**Endpoint:** `POST /api/auth/register`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newparent@example.com",
    "password": "NewParent123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+2348123456789",
    "role": "parent",
    "schoolCode": "GRA001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 5,
      "email": "newparent@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "parent",
      "emailVerified": false
    },
    "message": "Registration successful. Please check your email for verification link."
  }
}
```

---

### 2. User Login

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent1@example.com",
    "password": "Parent123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 3,
      "email": "parent1@example.com",
      "firstName": "Mary",
      "lastName": "Johnson",
      "role": "parent",
      "emailVerified": true
    },
    "session": {
      "id": "abc123...",
      "expiresAt": "2024-12-31T23:59:59.000Z"
    }
  }
}
```

**Save the session ID for authenticated requests!**

---

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_SESSION_ID"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 3,
      "email": "parent1@example.com",
      "firstName": "Mary",
      "lastName": "Johnson",
      "role": "parent",
      "emailVerified": true,
      "isActive": true
    },
    "children": [
      {
        "id": 1,
        "studentId": "GRA/2024/001",
        "firstName": "Sarah",
        "lastName": "Johnson"
      }
    ]
  }
}
```

---

### 4. Logout

**Endpoint:** `POST /api/auth/logout`

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"allSessions": false}'
```

---

## 🏫 School Management Tests

### 1. Create School (Super Admin Only)

**Endpoint:** `POST /api/schools`

```bash
curl -X POST http://localhost:3000/api/schools \
  -H "Authorization: Bearer SUPER_ADMIN_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Test School",
    "code": "TEST001",
    "email": "info@testschool.edu.ng",
    "phoneNumber": "+2348012345678",
    "address": "123 Test Street",
    "city": "Lagos",
    "state": "Lagos",
    "currency": "NGN",
    "academicYearFormat": "2024/2025",
    "numberOfTerms": 3
  }'
```

---

### 2. List Schools

**Endpoint:** `GET /api/schools`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` (optional)
- `status` (all, active, inactive, trial, suspended)
- `sortBy` (name, createdAt, updatedAt, code)
- `sortOrder` (asc, desc)

```bash
# List all schools (Super Admin)
curl "http://localhost:3000/api/schools?page=1&limit=10&status=active" \
  -H "Authorization: Bearer SUPER_ADMIN_SESSION_ID"

# School Admin sees only their school
curl http://localhost:3000/api/schools \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID"
```

---

### 3. Get School Details

**Endpoint:** `GET /api/schools/:id`

```bash
curl http://localhost:3000/api/schools/1 \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "school": {
      "id": 1,
      "name": "Grace Academy",
      "code": "GRA001",
      "email": "info@graceacademy.edu.ng",
      "phoneNumber": "+2348012345678",
      "address": "123 Education Street, Victoria Island",
      "city": "Lagos",
      "state": "Lagos",
      "country": "Nigeria",
      "currency": "NGN",
      "academicYearFormat": "2024/2025",
      "numberOfTerms": 3,
      "isActive": true,
      "subscriptionStatus": "active",
      "admin": {
        "id": 2,
        "email": "admin@graceacademy.edu.ng",
        "firstName": "John",
        "lastName": "Adebayo"
      }
    }
  }
}
```

---

### 4. Update School

**Endpoint:** `PATCH /api/schools/:id`

```bash
curl -X PATCH http://localhost:3000/api/schools/1 \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348099999999",
    "address": "New Address Street"
  }'
```

---

### 5. Get School Statistics

**Endpoint:** `GET /api/schools/:id/stats`

```bash
curl http://localhost:3000/api/schools/1/stats \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "schoolId": 1,
    "schoolName": "Grace Academy",
    "statistics": {
      "students": {
        "total": 3
      },
      "classes": {
        "total": 4
      },
      "revenue": {
        "total": 0,
        "currency": "NGN"
      },
      "payments": {
        "pending": 9,
        "overdue": 0
      }
    },
    "subscription": {
      "status": "active",
      "expiry": null,
      "isActive": true
    }
  }
}
```

---

## 👨‍🎓 Student Management Tests

### 1. Create Student (School Admin)

**Endpoint:** `POST /api/students`

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "GRA/2024/004",
    "admissionNumber": "ADM/004/2024",
    "schoolId": 1,
    "firstName": "David",
    "lastName": "Okonkwo",
    "dateOfBirth": "2010-03-15",
    "gender": "male",
    "classId": 1,
    "parentEmails": ["parent1@example.com"],
    "currentTerm": "Term 1",
    "academicYear": "2024/2025"
  }'
```

---

### 2. List Students

**Endpoint:** `GET /api/students`

**Query Parameters:**
- `page`, `limit`
- `search` (name, studentId, admissionNumber)
- `classId`
- `status` (all, active, graduated, transferred, suspended, expelled)
- `academicYear`
- `term`
- `gender`
- `sortBy`, `sortOrder`

```bash
# List all students in school (School Admin)
curl "http://localhost:3000/api/students?page=1&limit=20&status=active" \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID"

# Search students
curl "http://localhost:3000/api/students?search=sarah" \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID"

# Filter by class
curl "http://localhost:3000/api/students?classId=1" \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID"
```

---

### 3. Get Parent's Children

**Endpoint:** `GET /api/students/my-children`

```bash
curl http://localhost:3000/api/students/my-children \
  -H "Authorization: Bearer PARENT_SESSION_ID"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "children": [
      {
        "id": 1,
        "studentId": "GRA/2024/001",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "status": "active",
        "school": {
          "id": 1,
          "name": "Grace Academy",
          "code": "GRA001"
        },
        "class": {
          "id": 1,
          "name": "JSS 1A",
          "level": "JSS"
        },
        "currentTerm": "Term 1",
        "academicYear": "2024/2025"
      }
    ]
  }
}
```

---

### 4. Get Student Details

**Endpoint:** `GET /api/students/:id`

```bash
# Parent viewing their child
curl http://localhost:3000/api/students/1 \
  -H "Authorization: Bearer PARENT_SESSION_ID"

# School Admin viewing any student
curl http://localhost:3000/api/students/1 \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID"
```

---

### 5. Update Student

**Endpoint:** `PATCH /api/students/:id`

```bash
curl -X PATCH http://localhost:3000/api/students/1 \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348123456789",
    "specialNeeds": "Glasses required"
  }'
```

---

### 6. Assign Parent to Student

**Endpoint:** `POST /api/students/:id/assign-parent`

```bash
curl -X POST http://localhost:3000/api/students/1/assign-parent \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "parentUserId": 4
  }'
```

---

### 7. Assign Class to Student

**Endpoint:** `POST /api/students/:id/assign-class`

```bash
curl -X POST http://localhost:3000/api/students/1/assign-class \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": 2,
    "term": "Term 1",
    "academicYear": "2024/2025"
  }'
```

---

### 8. Graduate Student

**Endpoint:** `POST /api/students/:id/graduate`

```bash
curl -X POST http://localhost:3000/api/students/1/graduate \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "graduationDate": "2024-07-15T00:00:00.000Z",
    "certificate": "SSCE",
    "remarks": "Graduated with honors"
  }'
```

---

## 🔍 System Tests

### 1. Health Check

**Endpoint:** `GET /health`

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-05T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "database": "healthy",
    "payment": {
      "arca": "configured",
      "flutterwave": "configured"
    },
    "notifications": {
      "email": "configured",
      "sms": "not_configured",
      "whatsapp": "not_configured"
    }
  }
}
```

---

### 2. Database Health Check

**Endpoint:** `GET /health/db`

```bash
curl http://localhost:3000/health/db
```

---

### 3. API Documentation

**Endpoint:** `GET /api/docs`

```bash
curl http://localhost:3000/api/docs
```

---

## 🧪 Integration Test Scenarios

### Scenario 1: Complete Registration to Student Creation

**Step 1:** Register as Parent
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testparent@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "Parent",
    "role": "parent",
    "schoolCode": "GRA001"
  }'
```

**Step 2:** Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testparent@example.com",
    "password": "Test123!"
  }'
# Save session ID
```

**Step 3:** Login as School Admin
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@graceacademy.edu.ng",
    "password": "Admin123!"
  }'
# Save admin session ID
```

**Step 4:** Create Student
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer ADMIN_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "GRA/2024/TEST",
    "schoolId": 1,
    "firstName": "Test",
    "lastName": "Student",
    "gender": "male",
    "parentEmails": ["testparent@example.com"]
  }'
```

**Step 5:** Parent Views Children
```bash
curl http://localhost:3000/api/students/my-children \
  -H "Authorization: Bearer PARENT_SESSION_ID"
```

---

### Scenario 2: School Admin Managing Students

**Step 1:** Login as School Admin
**Step 2:** List all students
**Step 3:** Create new student
**Step 4:** Assign student to class
**Step 5:** View class enrollment
**Step 6:** Update student information
**Step 7:** View student details

---

## 🐛 Error Testing

### 1. Invalid Credentials

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wrong@example.com",
    "password": "wrongpassword"
  }'
```

**Expected:** 400 error with message

---

### 2. Missing Required Fields

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer SCHOOL_ADMIN_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test"
  }'
```

**Expected:** 400 validation error

---

### 3. Unauthorized Access

```bash
# Parent trying to create school
curl -X POST http://localhost:3000/api/schools \
  -H "Authorization: Bearer PARENT_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unauthorized School",
    "code": "UNAUTH001"
  }'
```

**Expected:** 403 Forbidden

---

### 4. Accessing Other Parent's Children

```bash
# Parent 1 trying to view Parent 2's child
curl http://localhost:3000/api/students/3 \
  -H "Authorization: Bearer PARENT1_SESSION_ID"
```

**Expected:** 403 Forbidden

---

## 📊 Rate Limiting Tests

### Test Rate Limits

```bash
# Send 6 requests quickly to trigger rate limit
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "Request $i"
done
```

**Expected:** After 5 requests, you should get 429 Too Many Requests

---

## 🔧 Troubleshooting

### Issue: "Unauthorized" Error

**Solution:**
1. Check if you're including the session ID
2. Verify session hasn't expired
3. Try logging in again

---

### Issue: "School context required"

**Solution:**
- School Admin users need to be assigned to a school
- Use Super Admin to assign admin to school first

---

### Issue: "Access denied"

**Solution:**
- Check if your role has permission for the endpoint
- Refer to RBAC permissions in documentation

---

## 📝 Postman Collection

### Import these endpoints into Postman:

**Base URL:** `http://localhost:3000`

**Environment Variables:**
- `base_url`: http://localhost:3000
- `session_id`: (set after login)
- `school_admin_session`: (set after admin login)
- `parent_session`: (set after parent login)

**Collections:**
1. Authentication
   - Register
   - Login
   - Logout
   - Get Me
   - Forgot Password
   - Reset Password

2. Schools
   - Create School
   - List Schools
   - Get School
   - Update School
   - Get School Stats

3. Students
   - Create Student
   - List Students
   - Get My Children
   - Get Student
   - Update Student
   - Assign Parent
   - Assign Class

4. System
   - Health Check
   - API Docs

---

## ✅ Testing Checklist

### Authentication Module
- [ ] User registration works
- [ ] Email verification sent
- [ ] Login returns session
- [ ] Logout works
- [ ] Password reset works
- [ ] Profile update works

### School Module
- [ ] Super Admin can create school
- [ ] School Admin can view their school
- [ ] School Admin cannot view other schools
- [ ] School stats are accurate
- [ ] School update works
- [ ] Admin assignment works

### Student Module
- [ ] School Admin can create student
- [ ] Parent can view their children only
- [ ] Student listing with filters works
- [ ] Student update works
- [ ] Parent assignment works
- [ ] Class assignment works
- [ ] Graduation works

### Security
- [ ] RBAC prevents unauthorized access
- [ ] Rate limiting works
- [ ] Session validation works
- [ ] Input validation catches errors

### Error Handling
- [ ] 400 for validation errors
- [ ] 401 for unauthorized
- [ ] 403 for forbidden
- [ ] 404 for not found
- [ ] 429 for rate limit

---

## 📚 Additional Resources

- **API Documentation:** http://localhost:3000/api/docs
- **Database Studio:** `bun run db:studio`
- **Logs:** Check console output
- **Health Check:** http://localhost:3000/health

---

**Happy Testing! 🚀**

For issues or questions, check COMPLETION_SUMMARY.md or NEXT_STEPS.md