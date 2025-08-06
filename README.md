# HourMaster - Mobile-First PWA for Hours Tracking

A mobile-first Progressive Web Application (PWA) designed for tracking hours across different categories with planning and analytics capabilities.

## Features

- 📱 **Mobile-First Design**: Optimized for mobile devices with touch-friendly interface
- ⚡ **PWA Support**: Install as a native app with offline functionality
- 📊 **Analytics**: Comprehensive time tracking with charts and insights
- 📅 **Planning**: Daily planning and weekly goal setting
- 💾 **Offline-First**: Works completely offline with IndexedDB storage
- 📤 **Export**: CSV export functionality for data portability

## Local Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd HourMaster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:3000`
   - For mobile testing, use your device's IP address or tools like ngrok

### Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema (requires DATABASE_URL)

### Environment Variables

For local development, no environment variables are required. The app uses IndexedDB for local storage.

For production deployment, you may need:
- `DATABASE_URL` - PostgreSQL connection string (optional for local dev)
- `PORT` - Server port (defaults to 3000)

### Mobile Testing

1. **Local Network**: Use your computer's IP address on the same network
2. **ngrok**: For external access, use ngrok: `ngrok http 3000`
3. **PWA Testing**: Install the app on your mobile device for full PWA experience

### Project Structure

```
HourMaster/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
│   └── index.html         # Entry point
├── server/                # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── vite.ts            # Vite integration
├── shared/                # Shared schemas and types
└── public/                # Static assets and PWA files
```

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Storage**: IndexedDB (client-side), PostgreSQL (optional)
- **UI**: Radix UI, shadcn/ui components
- **State**: TanStack Query, React Hook Form
- **PWA**: Service Worker, Web App Manifest

### Database

The app is designed to work offline-first using IndexedDB. PostgreSQL integration is optional and only needed for:
- Multi-user scenarios
- Data synchronization across devices
- Advanced analytics

For local development, all data is stored locally in the browser.

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

For production deployment, set the following environment variables:
- `NODE_ENV=production`
- `PORT=3000` (or your preferred port)
- `DATABASE_URL` (if using PostgreSQL)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details 