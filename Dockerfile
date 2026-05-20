FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=
ARG VITE_ANALYZE_ENDPOINT=/api/analyze-art
ARG VITE_MAX_UPLOAD_MB=10

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_ANALYZE_ENDPOINT=${VITE_ANALYZE_ENDPOINT} \
    VITE_MAX_UPLOAD_MB=${VITE_MAX_UPLOAD_MB}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
