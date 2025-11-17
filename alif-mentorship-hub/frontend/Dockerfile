# Use newer Node version required by Vite
FROM node:22-alpine

# Working directory inside container
WORKDIR /app

# Copy package files first (better caching)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run Vite dev server (Docker needs host 0.0.0.0)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
