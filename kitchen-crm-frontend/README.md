# Kitchen CRM - Frontend

A modern, professional CRM system for kitchen design and manufacturing businesses, built with React, TypeScript, and a distinctive Black/Red/White theme.

## 🎨 Theme

The application features a sophisticated **Black/Red/White** color scheme:
- **Black**: Professional backgrounds and structure
- **Red**: Accents, CTAs, and interactive elements
- **White**: Content, text, and clarity

## 🚀 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS with custom theme
- **Redux Toolkit** - State management
- **RTK Query** - API caching
- **React Router** - Client-side routing
- **React Hook Form + Zod** - Form validation
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **@tanstack/react-table** - Advanced tables
- **@headlessui/react** - Accessible components
- **Lucide React** - Icons
- **date-fns** - Date utilities

## 📁 Project Structure

```
src/
├── app/           # App configuration & store
├── features/      # Feature modules (Redux slices)
│   ├── auth/
│   ├── customers/
│   ├── dashboard/
│   ├── design-phase/
│   ├── production/
│   ├── products/
│   ├── quotations/
│   ├── projects/
│   └── payments/
├── components/    # Shared components
│   ├── ui/        # Base UI components
│   ├── layout/    # Layout components
│   └── shared/    # Business components
├── hooks/         # Custom hooks
├── services/      # API services
├── utils/         # Utility functions
├── types/         # TypeScript types
├── styles/        # Global styles & theme
├── routes/        # Route configuration
└── pages/         # Page components
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_API_TIMEOUT=30000
VITE_JWT_SECRET_KEY=your-secret-key
VITE_TOKEN_EXPIRY=3600
```

## 📋 Phase 1.1 - Complete ✅

Sprint 1.1: Project Initialization

- ✅ React + TypeScript project with Vite
- ✅ All core dependencies installed
- ✅ TailwindCSS with Black/Red/White theme
- ✅ Folder structure created
- ✅ Environment variables configured
- ✅ TypeScript strict mode enabled

## 🎯 Next Steps

**Phase 1.2: Core Infrastructure**
- Setup Axios instance with interceptors
- Configure Redux store with RTK Query
- Setup React Router
- Create base TypeScript types

**Phase 1.3: Development Tooling**
- Configure ESLint and Prettier
- Setup Husky for Git hooks
- Configure build optimization

## 📖 Documentation

- [Frontend Planning Report](../FRONTEND_PLANNING_REPORT.md)
- [API Documentation](../kitchen-crm-backend/)

## 🤝 Contributing

1. Follow the folder structure conventions
2. Use TypeScript strict mode
3. Follow the Black/Red/White theme
4. Write tests for components
5. Document complex logic

## 📄 License

Private - Kitchen CRM System
