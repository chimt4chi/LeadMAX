# LeadMax Payment System API

A production-quality REST API for a payment system built with **Node.js**, **Express**, **Sequelize ORM**, and **SQLite**.

## 🚀 Features

- **User Management** — Create, update, soft-delete, and list users
- **JWT Authentication** — 5-minute access tokens + 1-day refresh tokens with rotation
- **Bank Accounts** — Up to 3 accounts per user with balance management
- **Payments** — Atomic transfers with full transaction history
- **Validation** — Request validation on every endpoint
- **Security** — Bcrypt password hashing, token revocation, soft deletes

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| ORM | Sequelize |
| Database | SQLite (file-based, zero setup) |
| Auth | JSON Web Tokens (JWT) |
| Validation | express-validator |
| Password Hashing | bcryptjs |

---

## 🛠️ Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env if needed (defaults work out of the box)
```

### 3. Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

### 4. (Optional) Seed test data
```bash
npm run seed
```
This creates two test users (`alice@leadmax.com` / `bob@leadmax.com`) with bank accounts and a starting balance. Password: `Password1`

---

## 📡 API Reference

**Base URL:** `http://localhost:3000/api/v1`

All protected routes require: `Authorization: Bearer <accessToken>`

---

### 1. User APIs

#### 1.1 Create User
```
POST /users
```
**Body:**
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "phone": "+91 9876543210",
  "password": "SecurePass1"
}
```
**Response:** `201 Created`

---

#### 1.2 Update User
```
PUT /users/:id
```
🔒 Protected | **Body:** (all fields optional)
```json
{
  "name": "Alice Smith",
  "phone": "+91 9000000000",
  "password": "NewSecurePass1"
}
```

---

#### 1.3 Delete User
```
DELETE /users/:id
```
🔒 Protected | Soft-deletes the user and revokes all their tokens.

---

#### 1.4 Get User Profile
```
GET /users/:id
```
🔒 Protected

---

#### 1.5 Get Users List
```
GET /users?page=1&limit=10&search=alice
```
🔒 Protected | Query params: `page`, `limit`, `search`

---

### 2. Authentication APIs

#### 2.1 Login
```
POST /auth/login
```
**Body:**
```json
{
  "email": "alice@example.com",
  "password": "SecurePass1"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "tokenType": "Bearer",
    "expiresIn": 300
  }
}
```

**Token Expiry:**
- Access Token: **5 minutes**
- Refresh Token: **1 day**

---

#### 2.2 Refresh Token
```
POST /auth/refresh-token
```
**Body:**
```json
{ "refreshToken": "eyJ..." }
```
Returns a new access token **and** a new refresh token (rotation).

---

#### 2.3 Logout
```
POST /auth/logout
```
🔒 Protected | Revokes the provided refresh token.

---

### 3. Bank Account APIs

#### 3.1 Add Bank Account
```
POST /bank-accounts
```
🔒 Protected | Max 3 accounts per user
```json
{
  "accountNumber": "HDFC00123456",
  "bankName": "HDFC Bank",
  "accountHolderName": "Alice Johnson"
}
```

---

#### 3.2 Get Bank Accounts List
```
GET /bank-accounts
```
🔒 Protected | Returns all active accounts for the logged-in user.

---

#### 3.3 Delete Bank Account
```
DELETE /bank-accounts/:id
```
🔒 Protected | Soft-deletes the account.

---

#### 3.4 Top-up Balance
```
POST /bank-accounts/:id/topup
```
🔒 Protected
```json
{ "amount": 5000 }
```

---

### 4. Payment APIs

#### 4.1 Do Payment
```
POST /payments
```
🔒 Protected
```json
{
  "senderAccountId": "uuid-of-your-account",
  "receiverAccountId": "uuid-of-receiver-account",
  "amount": 1500.00,
  "description": "Rent payment"
}
```

**Payment Flow:**
- ✅ **SUCCESS:** Deducts from sender → Credits receiver → Records `SUCCESS`
- ❌ **FAILED:** Insufficient balance or invalid data → Records `FAILED` with reason

The transfer is executed in an **atomic DB transaction** — either both balance changes succeed or neither does.

---

#### 4.2 Get Transactions List
```
GET /payments/transactions?page=1&limit=10&status=SUCCESS
```
🔒 Protected | Filter by `status`: `SUCCESS` | `FAILED` | `PENDING`

Each transaction shows `direction: DEBIT | CREDIT` from the requesting user's perspective.

---

## 🔐 Security Design

| Feature | Implementation |
|---|---|
| Passwords | bcryptjs with 12 salt rounds |
| Access Token | JWT, 5-min expiry, `HS256` |
| Refresh Token | JWT, 1-day expiry, stored in DB |
| Token Rotation | Old refresh token revoked on every refresh |
| Soft Deletes | Users/accounts deactivated, not destroyed |
| Atomic Payments | Sequelize transactions with row-level locking |

---

## 📁 Project Structure

```
LEADMAX/
├── .env
├── .env.example
├── package.json
└── src/
    ├── server.js              # Entry point
    ├── app.js                 # Express setup
    ├── database/
    │   ├── connection.js      # Sequelize + SQLite config
    │   └── seed.js            # Test data seeder
    ├── models/
    │   ├── user.model.js
    │   ├── refreshToken.model.js
    │   ├── bankAccount.model.js
    │   └── transaction.model.js
    ├── controllers/
    │   ├── user.controller.js
    │   ├── auth.controller.js
    │   ├── bank.controller.js
    │   └── payment.controller.js
    ├── routes/
    │   ├── user.routes.js
    │   ├── auth.routes.js
    │   ├── bank.routes.js
    │   └── payment.routes.js
    ├── middleware/
    │   ├── auth.middleware.js
    │   └── validate.middleware.js
    └── validators/
        ├── user.validators.js
        ├── auth.validators.js
        ├── bank.validators.js
        └── payment.validators.js
```

---

## 📋 HTTP Status Codes Used

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `400` | Bad Request (business rule violation) |
| `401` | Unauthorized (missing/invalid/expired token) |
| `404` | Not Found |
| `409` | Conflict (duplicate email/account) |
| `422` | Unprocessable Entity (validation errors) |
| `500` | Internal Server Error |
