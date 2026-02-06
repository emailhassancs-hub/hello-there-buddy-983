# Rapid Assets Studio - Frontend

A modern React application built with Vite, TypeScript, and Tailwind CSS for the Rapid Assets Studio platform. This frontend provides a chat interface for AI-powered image generation, 3D model creation, and workflow management.

## 🚀 Tech Stack

- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 5.4+
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with Zod validation

## 📋 Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or yarn
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd game-ai-spt-game-ai-studio-fe-agentic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Main API URL (Middleware/Agentic) - used for chat, sessions, video list, etc.
   VITE_API_BASE_URL=https://your-middleware-api-url.com
   
   # Backend API URL (NestJS) - used for image generation history, model optimization, etc.
   VITE_API_BACKEND_URL=https://your-nestjs-api-url.com
   
   # Application Environment (development, staging, production)
   VITE_APP_ENV=development
   
   # Stripe Publishable Key (optional, for payments)
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

   **Note**: All environment variables in Vite must be prefixed with `VITE_` to be exposed to the client code.

## 🏃 Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:7071`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build for development/staging
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🏗️ Build

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Staging Build

```bash
npm run build:dev
```

Builds with development mode configuration.

## 🐳 Docker Deployment

The project includes a multi-stage Dockerfile for containerized deployment:

```bash
# Build the Docker image
docker build -t rapid-assets-frontend .

# Run the container
docker run -p 7071:7071 rapid-assets-frontend
```

### Environment Variables in Docker

Set build-time environment variables in the Dockerfile or via `--build-arg`:

```dockerfile
ENV VITE_API_BASE_URL=https://your-api-url.com
ENV VITE_API_BACKEND_URL=https://your-backend-url.com
ENV VITE_APP_ENV=production
```

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── chat/           # Chat interface components
│   └── ui/             # shadcn/ui components
├── lib/                 # Utility libraries and API clients
├── pages/               # Page components
├── utils/               # Helper functions
├── enums/               # TypeScript enums
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## 🔧 Key Features

- **Chat Interface**: Real-time chat with AI for image and 3D model generation
- **Image Upload**: Upload and process images (max 28MB, WebP not supported)
- **3D Model Viewer**: Interactive 3D model visualization using Three.js
- **Workflow Management**: Chain multiple AI tasks together
- **Credit System**: Track and manage user credits

## 🐛 Debugging

### Console Logs

- **Development/Staging**: All `console.log`, `console.warn`, and `console.error` are visible
- **Production**: Only `console.warn` and `console.error` are visible (`.log` is disabled)


## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_BASE_URL` | Middleware/Agentic API URL | Yes | - |
| `VITE_API_BACKEND_URL` | NestJS Backend API URL | Yes | - |
| `VITE_APP_ENV` | Application environment (development/staging/production) | No | development |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for payments | No | - |

## 🔒 Security Notes

- Environment variables prefixed with `VITE_` are exposed to the client bundle
- Never include sensitive keys (like Stripe secret keys) in frontend environment variables
- Use backend APIs for sensitive operations

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
4. Submit a pull request

## 📄 License

Private/Proprietary
