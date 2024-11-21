# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the application
CMD ["npm", "start"]
