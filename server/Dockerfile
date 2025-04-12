FROM node:18.17.1

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Add default port info (helpful for others & tools)
EXPOSE 5000

# Start the app
CMD ["node", "index.js"]
