# Authentication & Portal Access Guide

## Overview
The Explore More Academy website now has dedicated signup and login pages for **Student Portal** and **Parent Portal**, making it easy for users to register and access their respective portals.

## Portal URLs

### Student Portal
- **Signup**: `/student/signup`
- **Login**: `/student/login`
- **Dashboard**: `/student`

### Parent Portal
- **Signup**: `/parent/signup`
- **Login**: `/parent/login`
- **Dashboard**: `/parent`

### Admin Portal
- **Login**: `/admin/login`
- **Dashboard**: `/admin`
- **Email**: chris@exploremoreacademy.com

### General (All Roles)
- **Unified Login**: `/login`
- **Unified Signup**: `/register`

## User Registration Flow

### Student Registration
1. User visits `/student/signup`
2. Fills out form:
   - Full Name
   - Email
   - Password (min 8 characters)
   - Accepts Terms & Privacy Policy
3. Role is automatically set to **"student"**
4. Account created in database
5. **StudentProfile** automatically created
6. Verification email sent
7. User redirected to `/verify-email` page
8. After verification, user can login at `/student/login`
9. Redirected to Student Portal dashboard

### Parent Registration
1. User visits `/parent/signup`
2. Fills out form:
   - Full Name
   - Email
   - Password (min 8 characters)
   - Accepts Terms & Privacy Policy
3. Role is automatically set to **"parent"**
4. Account created in database
5. Verification email sent
6. User redirected to `/verify-email` page
7. After verification, user can login at `/parent/login`
8. Redirected to Parent Portal dashboard

## Login Flow

### Student Login
1. User visits `/student/login`
2. Enters email and password
3. NextAuth validates credentials
4. If valid, redirected to `/student` (Student Portal)
5. If invalid, error message displayed

### Parent Login
1. User visits `/parent/login`
2. Enters email and password
3. NextAuth validates credentials
4. If valid, redirected to `/parent` (Parent Portal)
5. If invalid, error message displayed

## Role-Based Access Control

The middleware automatically protects routes based on user roles:

| Portal | Required Role | Redirect if Unauthorized |
|--------|--------------|--------------------------|
| `/student/*` | student or administrator | `/student/login` |
| `/parent/*` | parent or administrator | `/parent/login` |
| `/admin/*` | administrator only | `/admin/login` |

**Public Pages** (no authentication required):
- `/student/signup`
- `/student/login`
- `/parent/signup`
- `/parent/login`
- `/register`
- `/login`
- All marketing pages (home, about, events, etc.)

## Features

### Portal-Specific Features

**Student Portal** includes:
- Dashboard
- My Courses
- Results
- Events
- Certificates
- Resources
- Messages
- Profile

**Parent Portal** includes:
- Dashboard
- Student Management (link to children)
- Messages
- Notifications
- Portfolio
- Tutors
- Receipts
- Settings

### Cross-Links

Each login/signup page includes helpful links:
- "Already have an account? Sign in"
- "Don't have an account? Create Account"
- "Are you a student/parent?" - link to other portal
- "Forgot password?" - password reset flow

## Database Schema

### User Model
```typescript
{
  name: string
  email: string (unique, lowercase)
  passwordHash: string
  role: "student" | "parent" | "instructor" | "administrator"
  emailVerified: boolean
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  avatar?: string
  phone?: string
  notificationPreferences: {...}
  loginAttempts: number
  lockUntil?: Date
  isActive: boolean
}
```

### StudentProfile Model (auto-created for students)
```typescript
{
  userId: ObjectId (ref User)
  dateOfBirth?: Date
  ageRange?: string
  schoolStatus?: "homeschool" | "traditional" | "other"
  bio?: string
  profileComplete: number
  emergencyContact?: {...}
}
```

### GuardianStudentLink Model (for parent-student connections)
```typescript
{
  guardianId: ObjectId (ref User)
  studentId: ObjectId (ref User)
  relationship: string
  status: "pending" | "approved" | "rejected"
  consentGiven: boolean
  consentDate?: Date
}
```

## Header Navigation

### When User is NOT Logged In
Top utility bar shows:
- Upcoming Events
- Student Login → `/student/login`
- Parent Login → `/parent/login`
- Sign Up → `/register`

### When User IS Logged In
Top utility bar shows:
- Upcoming Events
- Student Portal → `/student`
- Parent Portal → `/parent`

User dropdown menu shows:
- Email address
- Admin Portal (if administrator role)
- Student Portal
- Parent Portal
- Sign Out button

## Security Features

1. **Password Requirements**: Minimum 8 characters
2. **Email Verification**: Required before full portal access
3. **Account Lockout**: After failed login attempts
4. **JWT Sessions**: 30-day expiration
5. **Role-Based Middleware**: Automatic route protection
6. **HTTPS Only**: Secure credential transmission

## Testing

### Development Credentials
- **Admin Email**: chris@exploremoreacademy.com
- **Admin Password**: ChangeMe123!

### Test Student Account
1. Go to `/student/signup`
2. Register with test email
3. Check console/email for verification code (dev mode)
4. Verify email
5. Login at `/student/login`

### Test Parent Account
1. Go to `/parent/signup`
2. Register with test email
3. Check console/email for verification code (dev mode)
4. Verify email
5. Login at `/parent/login`

## API Endpoints

### Registration
- **POST** `/api/auth/register`
- Body: `{ name, email, password, role }`
- Returns: `{ success, emailSent, devVerificationCode? }`

### Authentication
- **POST** `/api/auth/signin` (NextAuth)
- Credentials: email, password
- Returns: JWT session

### Email Verification
- **POST** `/api/auth/verify-email`
- Body: `{ email, token }`
- Returns: `{ success }`

## Troubleshooting

### Users can't access portal after signup
- Check if email is verified
- Verify role is set correctly in database
- Check middleware configuration

### Verification email not received
- Check SMTP configuration in `.env.local`
- In development, verification code shown in console
- Check spam/junk folder

### Wrong portal redirect
- Verify user role in database
- Check middleware route protection
- Clear browser cache/cookies

## Next Steps

Consider implementing:
1. **Social Login**: Google, Facebook OAuth
2. **Two-Factor Authentication**: SMS or authenticator app
3. **Password Strength Meter**: Visual feedback during signup
4. **Profile Completion Wizard**: Guided onboarding
5. **Parent-Student Linking**: Automatic invitation system
