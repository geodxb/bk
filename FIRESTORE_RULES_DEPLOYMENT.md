# Fix Firestore Permissions Error

## Problem
The application is showing "Missing or insufficient permissions" because the Firestore security rules haven't been deployed to your Firebase project. This error occurs when trying to read/write user data from Firestore.

## Quick Status Check
If you're seeing this error, it means:
- ❌ Firestore security rules are not deployed
- ❌ Admin user document may not exist in Firestore
- ❌ Authentication user may not be created

## Solution: Deploy Rules via Firebase Console

Since `firebase login` is having issues in WebContainer, deploy the rules manually:

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/project/blackbull-4b009)
2. Navigate to **Firestore Database**
3. Click on the **Rules** tab

### Step 2: Copy and Paste Rules
Replace the existing rules with the content from `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Investors collection - only admins can read/write
    match /investors/{investorId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Transactions collection - admins can read/write all, investors can read their own
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      allow read: if request.auth != null && 
        resource.data.investorId == request.auth.uid;
    }
    
    // Withdrawal requests - admins can read/write all, investors can read/write their own
    match /withdrawalRequests/{requestId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      allow read, create: if request.auth != null && 
        resource.data.investorId == request.auth.uid;
    }
    
    // Commissions collection - only admins can read/write
    match /commissions/{commissionId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Commission withdrawals - only admins can read/write
    match /commissionWithdrawals/{withdrawalId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Step 3: Publish Rules
1. Click **Publish** to deploy the rules
2. Wait for confirmation that rules are deployed

### Step 4: Create Admin User Document
Since the rules require a user document to exist, you need to create it manually:

1. In Firebase Console, go to **Firestore Database** → **Data**
2. Click **Start collection**
3. Collection ID: `users`
4. Document ID: Use your Firebase Auth UID (you'll get this after authentication)
5. Add fields:
   - `email`: `crisdoraodxb@gmail.com`
   - `role`: `admin`
   - `createdAt`: Current timestamp

### Step 5: Enable Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Go to **Users** tab
4. Add user:
   - Email: `crisdoraodxb@gmail.com`
   - Password: `Messi24@`

### Step 6: Get User UID
1. After creating the user in Authentication, copy the UID
2. Go back to Firestore → Data → users collection
3. Use that UID as the document ID for your admin user document

## Alternative: Temporary Permissive Rules

If you need immediate access for testing, you can temporarily use these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING**: Only use permissive rules for testing. Replace with proper rules before production.

## Verification

After deploying rules and creating the admin user:

1. Try logging in with `crisdoraodxb@gmail.com` / `Messi24@`
2. Check browser console for any remaining errors
3. Verify you can access the admin dashboard

The "Missing or insufficient permissions" error should be resolved once the rules are properly deployed.