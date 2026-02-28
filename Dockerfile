FROM golang:1.25.3-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build an ultra-optimized, statically linked binary
# -trimpath: removes absolute build paths
# -ldflags="-s -w": strips debugging info to reduce binary size
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o server .

FROM alpine:3.19

# Add certificates (for outgoing HTTPS) and create a non-root user/group
RUN apk --no-cache add ca-certificates tzdata \
    && addgroup -S appgroup \
    && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/server .

USER appuser:appgroup

EXPOSE 8080
CMD ["./server"]