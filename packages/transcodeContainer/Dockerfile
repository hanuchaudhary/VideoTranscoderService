FROM node:18-alpine

# Install ffmpeg and upgrade base packages
RUN apk update && apk upgrade && apk add --no-cache ffmpeg

WORKDIR /app

# Copy and install dependencies
COPY package.json .
COPY package-lock.json .
RUN npm install

# Copy app source code
COPY index.js .

# Start the app
CMD ["npm", "start"]
