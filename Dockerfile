# -------- Stage 1: Build --------
    FROM node:20-alpine AS build
    WORKDIR /app
    
    # Install dependencies
    COPY package.json package-lock.json ./
    RUN npm ci --legacy-peer-deps
    
    # Copy source
    COPY . .
    
    # Set build-time env variables (Vite needs these at build time)
# ENV VITE_APP_ENV=staging
    ENV VITE_API_BACKEND_URL=https://games-ai-studio-be-nest-347148155332.us-central1.run.app
    ENV VITE_API_BASE_URL=https://games-ai-studio-middleware-agentic-dev-347148155332.us-central1.run.app
    ENV VITE_APP_ENV=production
    # ENV VITE_API_BACKEND_URL=https://api.rapidassets.ai
    # ENV VITE_API_BASE_URL=https://agent.rapidassets.ai
    ENV VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SDMyCRodhwKeNjpeBuwyEZfZezdXCUVGlLNM3BIAdnHXtRbXCEJjaRG44G0UlFZ5qLQPfXYfGy0kYXCqBpZkbEF00UFc5pWQM
    # Build
    RUN npm run build
    
    # -------- Stage 2: Serve --------
    FROM nginx:alpine
    
    # Install gettext for envsubst
    RUN apk add --no-cache gettext
    
    # Copy built files
    COPY --from=build /app/dist /usr/share/nginx/html
    
    # Copy nginx configuration template
    COPY nginx.conf /etc/nginx/templates/default.conf.template
    
    # Copy custom entrypoint script
    COPY docker-entrypoint.sh /docker-entrypoint-custom.sh
    RUN chmod +x /docker-entrypoint-custom.sh
    
    # Set default PORT (Cloud Run will override this)
    ENV PORT=7071
    
    # Expose Cloud Run port
    EXPOSE 7071
    
    ENTRYPOINT ["/docker-entrypoint-custom.sh"]
    CMD ["nginx", "-g", "daemon off;"]
    
