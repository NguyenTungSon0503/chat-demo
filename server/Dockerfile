#Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json .

RUN chown -R node:node /app

USER node

RUN npm install

COPY . .

RUN npm run build

#Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN chown -R node:node /app

USER node

COPY package*.json .

RUN npm ci --only=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src

RUN npm run prisma:generate

CMD ["node", "dist/index.js"]
