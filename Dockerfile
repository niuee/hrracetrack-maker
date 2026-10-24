FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY index.html vite.config.ts tsconfig.json ./
COPY src/frontend ./src/frontend
COPY public ./public
RUN pnpm build

FROM nginx:stable-alpine
ARG PORT=3001
ENV PORT=${PORT}
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE ${PORT}
