# ------------------------
# Stage 1: Build with Yarn
# ------------------------
FROM node:18-alpine AS build
WORKDIR /app

# Copy only package files first
COPY package.json yarn.lock ./


ENV YARN_IGNORE_ENGINES=true
RUN yarn config set ignore-engines true
RUN yarn install --frozen-lockfile

# Now copy source
COPY . .
RUN yarn build


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

# Cloud Run requires the app to listen on port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
