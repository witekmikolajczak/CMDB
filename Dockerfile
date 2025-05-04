# Dockerfile for CMDB monorepo development (Turborepo + PostgreSQL)
FROM node:18

WORKDIR /app

RUN npm install -g turbo

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Copy entrypoint script and make it executable
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
