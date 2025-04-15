# Smoke Shop Service — DriftiX Backend

## 1. Introduction
This document outlines the implementation of a **smoke shop service** for the DriftiX application. The service manages smoke shop products, orders, and categories. It uses a **modular architecture** with separation between models, services, and controllers.

---

## 2. Architecture Overview

**Three-layer architecture:**

- **Model Layer:** Defines the data schema using Mongoose
- **Service Layer:** Business logic + performance monitoring
- **Controller Layer:** Handles HTTP routing & responses

---

### 2.1 Model Layer (`smokeShop.model.ts`)

- Product name, description, price
- Category reference
- Stock count
- `createdAt` / `updatedAt` timestamps

---

### 2.2 Service Layer (`smokeShop.service.ts`)

- Singleton pattern
- CRUD: Products, Orders, Categories
- Error logging with `AppError`
- Metrics tracking

---

### 2.3 Controller Layer (`smokeShop.controller.ts`)

- HTTP endpoints
- Input validation
- Formatted response + error handling

---

## 3. Implementation Details

### 3.1 Mongoose Model
Implemented using Mongoose with schema validation and indexing for performance.

### 3.2 Service Logic
Includes:
- `.createProduct()`, `.getOrders()`, `.updateCategory()`...
- Catches and throws custom `AppError`
- Logs performance time for heavy ops

### 3.3 Error Handling
- Global `AppError` class
- HTTP status codes
- Centralized logger integration
- Graceful error returns

---

## 4. API Endpoints

### 4.1 Product Routes
- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`

### 4.2 Order Routes
- `GET /orders`
- `GET /orders/:id`
- `POST /orders`
- `PUT /orders/:id`
- `DELETE /orders/:id`

### 4.3 Category Routes
- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`

---

## 5. Security

- Input sanitization
- Structured error logging
- Scoped database access
- Performance monitoring hooks

---

## 6. Future Enhancements

- 🔐 Auth / role-based access
- ⚡ Caching (e.g. Redis)
- 📈 Analytics + dashboards
- 🛒 Inventory tracking
- 🔎 Advanced product filters
- ⛔ Rate limiting (express-rate-limit)

---

## 7. Conclusion

This smoke shop service provides a **robust, scalable, and cleanly separated backend** architecture for DriftiX. It's built for growth, reliability, and easy expansion into other verticals like food, rides, and liquor delivery. 