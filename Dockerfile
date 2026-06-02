# ---- Frontend build ----
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ---- Backend build ----
FROM golang:1.25-alpine AS backend
RUN apk add --no-cache gcc musl-dev
WORKDIR /app
COPY backend/ .
COPY --from=frontend /app/dist ./dist
RUN CGO_ENABLED=1 go build -o server .

# ---- Runtime ----
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
COPY --from=backend /app/server /server
EXPOSE 8080
CMD ["/server"]
