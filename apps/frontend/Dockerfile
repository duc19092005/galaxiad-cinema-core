FROM node:20-alpine AS base
WORKDIR /app
EXPOSE 5173

FROM base AS development
COPY package*.json ./
COPY scripts/ ./scripts/
RUN npm install
COPY . .
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS build
COPY package*.json ./
COPY scripts/ ./scripts/
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS final
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
