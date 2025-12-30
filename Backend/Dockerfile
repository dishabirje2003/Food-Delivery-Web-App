# 1. Use official Node image (match your version)
FROM node:22-alpine

# 2. Set working directory inside container
WORKDIR /app

# 3. Copy package files first (better caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install 

# 5. Copy rest of backend code
COPY . .

# 6. Expose backend port
EXPOSE 5000

# 7. Start the server
CMD ["node", "server.js"]
