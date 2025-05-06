FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Change to development mode
CMD ["npm", "run", "dev"]