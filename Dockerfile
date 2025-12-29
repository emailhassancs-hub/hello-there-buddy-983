# ------------------------
# Stage 1: Build with npm
# ------------------------
FROM node:18-alpine AS build
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
# Stage 2: Serve via nginx
# ------------------------
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy static build files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run requires the app to listen on port 7071
EXPOSE 7071

CMD ["nginx", "-g", "daemon off;"]
