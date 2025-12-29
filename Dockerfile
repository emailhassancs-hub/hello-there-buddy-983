# ------------------------
# Stage 1: Build with npm
# ------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Copy only package files first
COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps

# Now copy source
COPY . .

# Set environment variables for build (EDIT THESE VALUES)
ENV NODE_ENV=production
ENV VITE_API_BACKEND_URL=https://games-ai-studio-be-nest-347148155332.us-central1.run.app
ENV VITE_API_BASE_URL=https://games-ai-studio-middleware-agentic-main-347148155332.us-central1.run.app

# Build the application
RUN npm run build

# ------------------------
# Stage 2: Serve with Vite preview
# ------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built static files from build stage
COPY --from=build /app/dist ./dist

# Copy package.json and install vite
COPY package.json ./
RUN npm install vite --legacy-peer-deps

# Cloud Run requires the app to listen on port 7071
EXPOSE 7071

# Set the port
ENV PORT=7071

# Start Vite preview server
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "7071", "--dir", "dist"]
