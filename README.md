# Drifti X - Multi-service Delivery Platform

A comprehensive multi-service delivery platform built with Node.js, Express, and TypeScript.

## 🚀 Migration Protocol

### Core Mission
- Fix + Migrate + Clean + Verify
- Maintain proper separation of concerns
- Centralize shared logic
- Ensure clean, modular, and readable code

### Migration Process
For each file and folder:
1. Copy to correct location following new architecture
2. Fix broken components (imports, types, structure)
3. Refactor to match standards:
   - Proper Controller/Service separation
   - Centralized logging, error handling, and auth
   - Clean, modular, readable code
4. Validate with linting and type checking
5. Document changes in `.fixlog.json`

### Required Folder Structure
```
drifti-x/
├── backend/
│   └── src/
│       ├── controllers/     # Route controllers
│       ├── services/        # Business logic
│       ├── models/         # Database models
│       ├── routes/         # API routes
│       ├── types/          # TypeScript types
│       ├── middlewares/    # Express middlewares
│       ├── utils/          # Utility functions
│       ├── websockets/     # WebSocket/SSE logic
│       └── config/         # Configuration files
├── frontend/
│   └── src/
│       ├── components/     # React components
│       ├── hooks/         # Custom React hooks
│       ├── pages/         # Page components
│       ├── styles/        # CSS/SCSS files
│       ├── utils/         # Frontend utilities
│       └── types/         # Frontend types
└── __tests__/            # Test files
```

### Migration Tracker
| Source | Destination | Notes |
|--------|-------------|-------|
| types/ | @/types/ | Shared interfaces/types |
| controllers/ | src/controllers/ | Match filename with *.controller.ts |
| services/ | src/services/ | Business logic only |
| models/ | src/models/ | Mongoose schemas |
| routes/ | src/routes/ | Route setup |
| utils/ | src/utils/ | Formatting, shared functions |
| middlewares/ | src/middlewares/ | Auth, error handling |
| sockets/ | src/websockets/ | WebSocket/SSE logic |
| tests/ | __tests__/ | Grouped tests |

### Post-Migration Validation
After each migration batch:
1. Run `npm run lint`
2. Run `npm run type-check`
3. Update `.fixlog.json` with detailed changes:
```json
[
  {
    "file": "order.controller.ts",
    "change": "Migrated to src/controllers/, removed in-controller DB logic, added proper service delegation"
  }
]
```
4. Verify no errors, duplicates, or broken imports

### Escalation Criteria
Immediate escalation required for:
- Duplicate or conflicting types/interfaces
- Entangled Controller and Service logic
- Real-time logic issues (Socket.IO vs SSE)
- Migration crashes or failures

### Feature Completion
A feature is considered fully migrated when:
- All components are in correct locations
- Code is clean and modular
- Tests are passing
- No linting or type errors
- Documentation is updated
- Changes are logged in `.fixlog.json`

## Features

- **Multi-service Support**
  - Rideshare
  - Food Delivery
  - Package Delivery
  - Smoke Shop
  - Laundry Service

- **Analytics Dashboard**
  - Real-time metrics and trends
  - User behavior analytics
  - Service performance tracking
  - Customizable time periods
  - Advanced aggregation queries

- **User Management**
  - Role-based access control
  - Secure authentication
  - Profile management
  - Activity tracking

- **Order Management**
  - Real-time order tracking
  - Payment processing
  - Order history
  - Service-specific workflows

- **Notifications**
  - Real-time updates
  - Email notifications
  - Push notifications
  - WebSocket support

## Tech Stack

- **Backend**
  - Node.js
  - Express.js
  - TypeScript
  - MongoDB
  - Mongoose
  - Socket.IO

- **Testing**
  - Jest
  - Supertest
  - MongoDB Memory Server

- **Development Tools**
  - ESLint
  - Prettier
  - Husky
  - TypeScript
  - Nodemon

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/drifti-x.git
cd drifti-x
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/drifti-x
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types
- `npm run fix:background` - Run background fixes
- `npm run fix:analyze` - Analyze fixes
- `npm run fix:slack` - Send Slack alerts
- `npm run migrate:files` - Migrate files

## Error Handling

The platform implements a robust error handling system:

- Custom error classes for different scenarios
- Detailed error logging
- Sentry integration for error tracking
- Structured error responses
- Validation error handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Express.js team
- MongoDB team
- TypeScript team
- All contributors and maintainers 