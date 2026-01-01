# Firebase Firestore Setup Instructions

## Problem
Your Firebase project `e-commerce-94878` doesn't have a Firestore database initialized, which is causing the `Error: 5 NOT_FOUND` when trying to connect.

## Solution: Initialize Firestore Database

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **e-commerce-94878**
3. In the left sidebar, click on **"Firestore Database"**
4. Click **"Create database"**
5. Choose **"Start in test mode"** for development (you can configure security rules later)
6. Select location: **africa-south1** (matches your firebase.json configuration)
7. Click **"Done"**

### Option 2: Using Firebase CLI (if you have proper authentication)
```bash
# Login to Firebase (if not already logged in)
firebase login

# Use the project
firebase use e-commerce-94878

# Initialize Firestore (this usually opens the web console)
firebase init firestore
```

## After Firestore is Created

Once the Firestore database is created, your authentication should work. The database will be empty initially, which is normal.

### Verify Connection
Run the test script again:
```bash
node test-firebase.js
```

This should now show success messages instead of errors.

## Security Rules (Optional but Recommended)

For production, you should configure Firestore security rules. The current `firestore.rules` file contains basic rules, but you'll need to deploy them after setting up authentication properly.

## Next Steps

1. Create the Firestore database using one of the methods above
2. Test the connection
3. Run your development server: `pnpm dev`
4. Test user registration and login

The authentication system should now work without the NOT_FOUND errors.