# Driftix Backend

This is the backend for the Driftix application, a multi-service delivery platform.

## 🚀 Quick Start

```bash
# Clone and enter project
git clone https://github.com/your-org/driftix-backend.git
cd driftix-backend

# Install dependencies
npm install

# Start development server
npm run dev
```

The server will start on port 3000 by default.

## Features

- Smoke shop service with product, order, and category management
- Error handling and logging
- TypeScript support
- Express.js framework
- Winston logger
- Swagger API documentation
- Rate limiting
- CORS support

## 📚 API Documentation

The API documentation is available at `/docs` when running the server. It provides:
- Interactive API testing
- Request/response schemas
- Authentication details
- Example requests

## 🔧 Environment Variables

| Variable               | Description                     | Default           |
|------------------------|---------------------------------|-------------------|
| PORT                   | Server port                     | 3000             |
| NODE_ENV              | Environment (dev/prod)          | development      |
| JWT_SECRET            | JWT signing key                 | -                |
| MONGODB_URI           | MongoDB connection URI          | -                |
| CORS_ORIGIN           | Allowed frontend origins        | *                |
| LOG_LEVEL             | Logging verbosity               | info             |
| RATE_LIMIT_WINDOW_MS  | Rate limiting window (ms)       | 900000 (15 min)  |
| RATE_LIMIT_MAX        | Max requests per window         | 100              |

Create a `.env` file in the root directory with these variables.

## 🛣️ Roadmap

### Phase 1: Core Features
- [x] Basic smoke shop service
- [x] Error handling & logging
- [x] API documentation
- [ ] User authentication + roles
- [ ] Inventory management
- [ ] Admin dashboard API

### Phase 2: Security & Performance
- [ ] Rate limiting & abuse prevention
- [ ] API key management
- [ ] Caching layer
- [ ] Performance monitoring
- [ ] Automated testing

### Phase 3: Advanced Features
- [ ] Multi-language support
- [ ] Analytics & reporting
- [ ] WebSocket integration
- [ ] Payment processing
- [ ] Push notifications

## 🤝 Contributing

### Git Flow
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `npm test`
4. Push to branch: `git push origin feature/your-feature`
5. Create a Pull Request

### Commit Style
We use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Maintenance tasks

### Issue Labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation changes
- `question` - Further information is requested
- `help wanted` - Extra attention is needed

## API Endpoints

### Smoke Shop Service

#### Products
- `GET /api/smoke-shop/products` - Get all products
- `GET /api/smoke-shop/products/:id` - Get a product by ID
- `POST /api/smoke-shop/products` - Create a new product
- `PUT /api/smoke-shop/products/:id` - Update a product
- `DELETE /api/smoke-shop/products/:id` - Delete a product

#### Orders
- `GET /api/smoke-shop/orders` - Get all orders
- `GET /api/smoke-shop/orders/:id` - Get an order by ID
- `POST /api/smoke-shop/orders` - Create a new order
- `PUT /api/smoke-shop/orders/:id` - Update an order
- `DELETE /api/smoke-shop/orders/:id` - Delete an order

#### Categories
- `GET /api/smoke-shop/categories` - Get all categories
- `POST /api/smoke-shop/categories` - Create a new category
- `PUT /api/smoke-shop/categories/:id` - Update a category
- `DELETE /api/smoke-shop/categories/:id` - Delete a category

## Error Handling

The application uses a custom error handling system with the following error codes:

- `VALIDATION_ERROR` (400) - Input validation failed
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Access denied
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `INTERNAL_SERVER_ERROR` (500) - Server error

## Logging

The application uses Winston for logging. Logs are written to both the console and files:

- `error.log` - Error logs
- `combined.log` - All logs

## 🌍 Internationalization

The API supports multiple languages through the `Accept-Language` header:
- `en` - English (default)
- `es` - Spanish
- `fr` - French

## License

This project is licensed under the MIT License. 