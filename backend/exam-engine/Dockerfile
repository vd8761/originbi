# Start from the official Go image
FROM golang:1.23-alpine AS builder

# Set working directory
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
# -o exam-engine: output binary name
# ./cmd/api/main.go: entry point
RUN go build -o exam-engine ./cmd/api/main.go

# Start a new stage from scratch
FROM alpine:latest

WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/exam-engine .

# Expose port (Render sets PORT env, but good to document)
EXPOSE 4005

# Command to run the executable
CMD ["./exam-engine"]
