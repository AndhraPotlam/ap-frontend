FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Use npm ci for production install
RUN npm ci

COPY . .

# Build the app
RUN npm run build

EXPOSE 3000

# Use Next.js production server
CMD ["npm", "start"]