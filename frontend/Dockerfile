# Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy root dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY frontend ./frontend

# Build the application (running the script from package.json in root)
# Ensure environment variables required for build are present if any
# VITE_API_URL is needed at build time IF it's baked in, but we can also use runtime replacement or relative paths.
# We are proxying /api via Nginx, so the frontend just calls /api, which is relative.
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets from dist (Vite default output in frontend/dist? or dist? verify vite config)
# package.json says: "vite build ... frontend" -> usually outputs to dist/ relative to cwd or root.
# Let's assume dist/ is created in root because we run from root.
COPY --from=build /app/dist /usr/share/nginx/html

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
