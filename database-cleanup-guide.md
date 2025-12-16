# 🗄️ Database Cleanup Guide

## Current Issue:
You have duplicate institutions being created:
- ❌ `/users/{userId}` - contains `institutionCode` field 
- ✅ `/institutions/{institutionCode}` - should be the main institution document
- ✅ `/institutions/{institutionCode}/students/{studentId}` - where student data is correctly saved

## Fixed Structure:
```
📊 Firebase Firestore Database
├── 👤 users/
│   └── {userId}/
│       ├── institutionCode: "INST001"    ← Reference only
│       ├── role: "institution"
│       └── ... other user data
│
└── 🏢 institutions/
    └── {institutionCode}/               ← Main institution doc
        ├── institutionCode: "INST001"
        ├── name: "Institution INST001"
        ├── adminEmail: "admin@example.com"
        ├── createdAt: timestamp
        └── 👥 students/                 ← Student subcollection
            └── {studentId}/
                ├── biMonthlyMarks: [...]
                ├── attendanceData: [...]
                └── ... student data
```

## What I Fixed:
✅ **Login.jsx** - Now properly creates `/institutions/{institutionCode}` document during:
- Institution user registration
- Institution user login

## Manual Cleanup Steps (if needed):

### 1. Check Your Current Data Structure:
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: "campuscare-45120"
3. Navigate to Firestore Database
4. Check if you see:
   - ✅ `institutions` collection at root level
   - ❌ Any student data under `users` collection (should be moved)

### 2. If You Find Misplaced Data:
**Option A: Let the system auto-fix** (Recommended)
- Just login again as institution admin
- The new code will create proper structure
- Old data will remain but won't cause issues

**Option B: Manual cleanup** (if needed)
1. **Move students from wrong location:**
   - If students are in `/users/{userId}/students/`
   - Move them to `/institutions/{institutionCode}/students/`

2. **Delete duplicate institution docs:**
   - Keep only `/institutions/{institutionCode}`
   - Remove any under `/users/{userId}/institutions/`

### 3. Verify Everything Works:
1. Login as institution admin
2. Go to Institution Dashboard
3. Click "Show Tiles" for marks/attendance
4. Try adding a student
5. Try saving marks/attendance data
6. Check Firebase Console to see data saved in correct location

## Current Data Flow:
```
Institution Login → Creates /institutions/{code}/ → Student tiles save to /institutions/{code}/students/{id}
```

## Security Rules Updated:
- ✅ Supports new nested structure
- ✅ Maintains backward compatibility
- ✅ Proper access controls by institution

## No Action Required If:
- You can see students in Institution Dashboard
- Marks and attendance tiles save successfully
- No error messages in console

The system will work correctly with both old and new structure! 🎉