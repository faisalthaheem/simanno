FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY app/package*.json ./

# Install dependencies with legacy peer deps to handle version conflicts
RUN npm install --legacy-peer-deps && npm install -g @angular/cli

# Copy application source
COPY app/ .

# Build the Angular application
RUN ng build --configuration production

# Use the latest nginx alpine image
FROM nginx:alpine

# Copy nginx configuration
COPY dockerfiles/web/default.conf /etc/nginx/conf.d/default.conf

# Copy built Angular application
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
