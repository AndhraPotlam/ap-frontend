FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

# Use yarn install for clean installs
RUN yarn install --frozen-lockfile

COPY . .

# Build the app
RUN yarn build

EXPOSE 3000

# Use Next.js production server
CMD ["yarn", "start"]