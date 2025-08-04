# TimeTracker - Mobile-First PWA for Hours Tracking

## Overview

TimeTracker is a mobile-first Progressive Web Application (PWA) designed for tracking hours across different categories with planning and analytics capabilities. The application follows a clean, dark-themed design optimized for mobile devices and provides comprehensive time management features including daily planning, hour logging, weekly goals, and data analytics with export functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern React features
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom CSS variables for theming and shadcn/ui components for consistent UI elements
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with custom styling via shadcn/ui for accessibility and consistency

### Backend Architecture
- **Server**: Express.js with TypeScript for API endpoints
- **Development**: Hot module replacement with Vite integration for seamless development experience
- **Storage Interface**: Abstracted storage layer with in-memory implementation (MemStorage) as default
- **Session Management**: Prepared for connect-pg-simple for PostgreSQL-based sessions

### Data Storage Solutions
- **Client-Side**: IndexedDB using idb library for offline-first data persistence
- **Schema**: Zod for runtime type validation and schema definitions
- **Database Preparation**: Drizzle ORM configured for PostgreSQL with migration support
- **Local Storage**: Browser's IndexedDB stores categories, time entries, weekly goals, and daily plans

### PWA Features
- **Service Worker**: Custom service worker for offline functionality and caching
- **Manifest**: Web app manifest for native app-like installation experience
- **Mobile Optimization**: Touch-friendly interface with mobile-first responsive design
- **Offline Support**: Full offline functionality with local data synchronization

### Application Structure
- **Component-Based**: Modular React components for Dashboard, Planning, Entry, and Analytics views
- **Bottom Navigation**: Mobile-optimized navigation pattern for easy thumb navigation
- **Data Models**: Four core entities - Categories, Time Entries, Weekly Goals, and Daily Plans
- **Export Functionality**: CSV export capability using PapaParse for data portability

### Design Patterns
- **Mobile-First**: All UI components designed primarily for mobile devices with desktop support
- **Dark Theme**: Custom dark color scheme with CSS variables for easy theming
- **Glass Effect**: Subtle visual effects for modern interface aesthetics
- **Responsive Grid**: Flexible layouts that adapt to different screen sizes

## External Dependencies

### UI and Styling
- **Radix UI**: Comprehensive primitive components for accessibility (@radix-ui/react-*)
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing
- **Class Variance Authority**: Type-safe variant styling for component systems
- **Lucide React**: Icon library for consistent iconography

### Data and State Management
- **TanStack Query**: Server state management and caching
- **IndexedDB (idb)**: Browser database for offline data storage
- **Zod**: Schema validation and type inference
- **React Hook Form**: Form state management with @hookform/resolvers

### Development and Build
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking and improved developer experience
- **ESBuild**: Fast JavaScript/TypeScript bundler for production
- **Replit Integration**: Development environment plugins for Replit platform

### Data Processing
- **PapaParse**: CSV parsing and generation for data export
- **File-Saver**: Client-side file downloading functionality
- **Date-fns**: Date manipulation and formatting utilities

### Future Database Integration
- **Drizzle ORM**: Prepared for PostgreSQL integration with type-safe queries
- **Neon Database**: Serverless PostgreSQL for production deployment
- **Connection Pooling**: PostgreSQL session store for scalable session management