# HouseMate Backend API

Express + MongoDB backend for the HouseMate app.

## Stack
- **Node.js** + **Express** — REST API
- **MongoDB** + **Mongoose** — Database & ODM
- **JWT** (Access + Refresh tokens) — Auth
- **bcryptjs** — Password hashing
- **Joi** — Request validation
- **Helmet** + **CORS** + **Rate Limiting** — Security

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# 3. Seed the database
npm run seed

# 4. Start dev server
npm run dev
```

---

## API Documentation (Swagger)

Interactive OpenAPI docs are available when the server is running:

| URL | Description |
|-----|-------------|
| [http://localhost:5000/api-docs](http://localhost:5000/api-docs) | Swagger UI — try endpoints in the browser |
| [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json) | Raw OpenAPI 3.0 JSON spec |

**Using authenticated endpoints:**
1. Call `POST /api/auth/login` or `POST /api/auth/register` from Swagger UI
2. Copy the `accessToken` from the response
3. Click **Authorize** (top right) and paste: `Bearer <your-token>`

---

## Project Structure

```
housemate-backend/
├── server.js                    # Entry point
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── swagger.js           # OpenAPI 3.0 spec
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── houseController.js
│   │   ├── taskController.js
│   │   ├── expenseController.js
│   │   ├── inventoryController.js
│   │   ├── notificationController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT protect, requireHouse, requireAdmin
│   │   ├── errorHandler.js      # Global error handler
│   │   └── validate.js          # Joi validation schemas
│   ├── models/
│   │   ├── User.js
│   │   ├── House.js
│   │   ├── Task.js
│   │   ├── Expense.js
│   │   ├── Inventory.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── houses.js
│   │   ├── tasks.js
│   │   ├── expenses.js
│   │   ├── inventory.js
│   │   ├── notifications.js
│   │   └── users.js
│   └── utils/
│       ├── jwt.js               # Token generation & verification
│       ├── response.js          # Standard API response helpers
│       ├── gamification.js      # Points, badges, leaderboard logic
│       └── seeder.js            # Mock data seeder
```

---

## API Endpoints

### 🔐 Auth — `/api/auth`
| Method | Endpoint              | Auth | Description           |
|--------|-----------------------|------|-----------------------|
| POST   | `/register`           | ❌   | Register new user     |
| POST   | `/login`              | ❌   | Login                 |
| POST   | `/refresh`            | ❌   | Refresh access token  |
| GET    | `/me`                 | ✅   | Get current user      |
| PUT    | `/me`                 | ✅   | Update profile        |
| PUT    | `/change-password`    | ✅   | Change password       |
| POST   | `/logout`             | ✅   | Logout                |

### 🏠 Houses — `/api/houses`
| Method | Endpoint                          | Auth  | Role  | Description             |
|--------|-----------------------------------|-------|-------|-------------------------|
| POST   | `/`                               | ✅    | Any   | Create a house          |
| POST   | `/join`                           | ✅    | Any   | Join via invite code    |
| GET    | `/me`                             | ✅    | Any   | Get my house            |
| PUT    | `/me`                             | ✅    | Admin | Update house info       |
| PUT    | `/me/settings`                    | ✅    | Admin | Update house settings   |
| POST   | `/me/invite`                      | ✅    | Admin | Regenerate invite code  |
| POST   | `/me/leave`                       | ✅    | Any   | Leave house             |
| GET    | `/me/leaderboard`                 | ✅    | Any   | Get leaderboard         |
| PUT    | `/members/:memberId/role`         | ✅    | Admin | Update member role      |
| DELETE | `/members/:memberId`              | ✅    | Admin | Remove member           |

### ✅ Tasks — `/api/tasks`
| Method | Endpoint                   | Description                      |
|--------|----------------------------|----------------------------------|
| GET    | `/`                        | List tasks (filterable)          |
| POST   | `/`                        | Create task                      |
| GET    | `/today`                   | Today's tasks for current user   |
| GET    | `/analytics`               | Monthly analytics + heatmap      |
| GET    | `/:id`                     | Get task details                 |
| PUT    | `/:id`                     | Update task                      |
| DELETE | `/:id`                     | Delete task                      |
| POST   | `/:id/complete`            | Mark task complete (awards pts)  |
| POST   | `/:id/assist/request`      | Request assist from housemates   |
| POST   | `/:id/assist/accept`       | Accept an assist request         |
| POST   | `/:id/swap/request`        | Request duty swap                |
| POST   | `/:id/swap/respond`        | Accept/reject swap request       |
| POST   | `/:id/sick`                | Request sick leave               |
| POST   | `/:id/sick/cover`          | Volunteer to cover sick leave    |
| POST   | `/:id/marketplace`         | Post task to marketplace         |
| POST   | `/:id/claim`               | Claim marketplace task           |

### 💰 Expenses — `/api/expenses`
| Method | Endpoint        | Description               |
|--------|-----------------|---------------------------|
| GET    | `/`             | List expenses             |
| POST   | `/`             | Add expense               |
| GET    | `/summary`      | Monthly summary + balance |
| POST   | `/:id/settle`   | Mark split as paid        |
| DELETE | `/:id`          | Delete expense            |

### 📦 Inventory — `/api/inventory`
| Method | Endpoint           | Description             |
|--------|--------------------|-------------------------|
| GET    | `/`                | List inventory items    |
| POST   | `/`                | Add item                |
| GET    | `/alerts`          | Low/out-of-stock alerts |
| PUT    | `/:id`             | Update item             |
| DELETE | `/:id`             | Delete item             |
| POST   | `/:id/refill`      | Request refill          |

### 🔔 Notifications — `/api/notifications`
| Method | Endpoint    | Description              |
|--------|-------------|--------------------------|
| GET    | `/`         | Get notifications        |
| GET    | `/count`    | Get unread count         |
| PUT    | `/read`     | Mark as read             |
| DELETE | `/:id`      | Delete notification      |

### 👤 Users — `/api/users`
| Method | Endpoint              | Description               |
|--------|-----------------------|---------------------------|
| GET    | `/me/profile`         | My full profile + badges  |
| GET    | `/house-members`      | All house members         |
| GET    | `/:id`                | Public profile of member  |

---

## Mock Data (after `npm run seed`)

**House:** 12A06 Boys Flat (Invite: `12A06`)

| Name        | Email                      | Points | Rank | Password     |
|-------------|----------------------------|--------|------|--------------|
| Faizu       | faizu@housemate.app        | 240    | #2   | password123  |
| Harri       | harri@housemate.app        | 420    | #1   | password123  |
| Bala        | bala@housemate.app         | 230    | #3   | password123  |
| Athreya     | athreya@housemate.app      | 210    | #4   | password123  |
| Dhayanandh  | dhayanandh@housemate.app   | 180    | #5   | password123  |
| Afzal       | afzal@housemate.app        | 150    | #6   | password123  |

---

## Response Format

All endpoints return:

```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "meta": { "total": 10, "page": 1, "limit": 20 }
}
```

Errors:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "email is required" }]
}
```

---

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/housemate
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=30d
CLIENT_URL=http://localhost:3000
```

---

## Gamification System

- **Points** awarded on task completion, assist, sick coverage, swap bonuses
- **Streak** tracked daily — resets if a day is missed
- **Badges**: Cleaning King (100 tasks), Best Friend (25 assists), Unstoppable (30-day streak), and more
- **Leaderboard** recalculates ranks on every point award
- **Marketplace** — post unwanted tasks; others can claim for bonus points
