# Database Management Scripts

This directory contains helpful scripts for managing your MongoDB database.

## Available Scripts

### 1. Test Database Connection
**File**: `testConnection.js`

Verifies database connection and shows all mahals in the database.

```bash
node src/scripts/testConnection.js
```

**Output**:
- Database connection status
- List of all collections
- Total count of mahals
- Details of first 3 mahals

### 2. Approve All Pending Mahals
**File**: `approveMahals.js`

Automatically approves all mahals with `approvalStatus: 'pending'`.

```bash
node src/scripts/approveMahals.js
```

**Output**:
- List of pending mahals
- Number of mahals updated
- Total approved mahals count

**Use When**:
- You've just uploaded new mahals to the database
- Mahals aren't showing on the website
- You want to bulk-approve mahals for testing

### 3. Check Mahal Status
**File**: `checkMahals.js`

Shows a detailed status report of all mahals.

```bash
node src/scripts/checkMahals.js
```

**Output**:
- Total mahals count
- Count by status (approved, pending, rejected)
- Detailed list of all mahals with their status

**Use When**:
- You want to see the current state of all mahals
- Debugging approval status issues
- Quick overview of database contents

## Common Use Cases

### Mahals Not Showing on Website?
1. Run `testConnection.js` to verify database connection
2. Run `checkMahals.js` to see mahal statuses
3. If mahals are pending, run `approveMahals.js`
4. Refresh your website

### After Uploading New Data
```bash
# Check what was uploaded
node src/scripts/testConnection.js

# Approve all pending mahals
node src/scripts/approveMahals.js

# Verify approval
node src/scripts/checkMahals.js
```

### Regular Monitoring
```bash
# Quick status check
node src/scripts/checkMahals.js
```

## Requirements

All scripts require:
- MongoDB running (localhost:27017 or configured in .env)
- Node.js installed
- Dependencies installed (`npm install`)

## Environment Variables

Scripts use the same `.env` file as the main application:

```env
MONGODB_URI=mongodb://localhost:27017/mahal
```

If not set, defaults to `mongodb://localhost:27017/mahal`.
