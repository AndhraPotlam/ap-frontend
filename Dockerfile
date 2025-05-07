FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Use npm ci for production install
RUN npm ci

COPY . .

# Build the app
RUN npm run build

# Install serve to run the production build
RUN npm install -g serve

EXPOSE 3000

# Serve the production build
CMD ["serve", "-s", "build", "-l", "3000"]