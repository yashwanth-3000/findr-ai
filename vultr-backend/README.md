# FastAPI Vultr Deployment

A simple FastAPI application ready for deployment on Vultr Cloud Infrastructure.

## Features

- ✅ FastAPI with automatic OpenAPI documentation
- ✅ CORS middleware for frontend integration
- ✅ Health check endpoint for load balancer monitoring
- ✅ RESTful API with CRUD operations
- ✅ Pydantic models for data validation
- ✅ Production-ready with Gunicorn + Uvicorn

## API Endpoints

- `GET /` - Root endpoint with welcome message
- `GET /health` - Health check for monitoring
- `GET /info` - Server information
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation
- `POST /items` - Create a new item
- `GET /items` - Get all items
- `GET /items/{id}` - Get specific item
- `DELETE /items/{id}` - Delete an item

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py

# Server will be available at:
# http://localhost:8000
# API docs: http://localhost:8000/docs
```

## Vultr Deployment

### Prerequisites

1. Vultr API key (from Account → API)
2. Vultr CLI installed
3. Local project ready

### Step 1: Install Vultr CLI

```bash
# macOS/Linux with Homebrew
brew install vultr-cli

# Or with Go (>= 1.20)
go install github.com/vultr/vultr-cli/v2@latest
```

### Step 2: Set API Key

```bash
export VULTR_API_KEY="YOUR_API_KEY"
```

### Step 3: Create VM Instance

```bash
# Create Ubuntu 24.04 instance in Bangalore
vultr-cli instance create \
  --region blr \
  --plan vc2-1c-1gb \
  --os 387 \
  --label fastapi-demo

# Get instance info
vultr-cli instance list
vultr-cli instance get --id <INSTANCE_ID>
```

### Step 4: Deploy Application

```bash
# Copy code to server
SERVER_IP=<YOUR_SERVER_IP>
scp -r vultr-backend/ root@$SERVER_IP:/opt/myapi

# SSH and deploy with Docker
ssh root@$SERVER_IP

# Run FastAPI with pre-built image
docker run -d --name fastapi \
  -p 80:80 \
  -e MODULE_NAME=main \
  -e PORT=80 \
  -v /opt/myapi:/app \
  ghcr.io/tiangolo/uvicorn-gunicorn-fastapi:python3.11
```

### Step 5: Test Deployment

```bash
# Test the API
curl http://$SERVER_IP/
curl http://$SERVER_IP/health
curl http://$SERVER_IP/info

# Open in browser
open http://$SERVER_IP/docs
```

## Production Enhancements

### Custom Domain
```bash
vultr-cli dns domain create --domain api.yourdomain.com --ip $SERVER_IP
```

### HTTPS with Caddy
```bash
docker run -d --name caddy \
  -p 443:443 -p 80:80 \
  -v caddy_data:/data \
  -v caddy_config:/config \
  caddy:latest caddy reverse-proxy \
  --from api.yourdomain.com \
  --to fastapi:80
```

### Update Application
```bash
# Update code
scp -r vultr-backend/ root@$SERVER_IP:/opt/myapi
ssh root@$SERVER_IP "docker restart fastapi"
```

## Scaling Options

1. **Vertical Scaling**: Upgrade VM plan via Vultr CLI
2. **Horizontal Scaling**: Use Vultr Kubernetes Engine
3. **Load Balancing**: Add Vultr Load Balancer
4. **Database**: Use Vultr Managed Database
5. **Storage**: Add Vultr Block Storage or VFS

## Monitoring

- Health check: `GET /health`
- Server info: `GET /info`
- Docker logs: `docker logs fastapi`
- System resources: `htop`, `df -h`

## Security Checklist

- [ ] Configure firewall rules
- [ ] Set up SSH key authentication
- [ ] Enable HTTPS/SSL
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Monitor access logs

## Cost Optimization

- Start with `vc2-1c-1gb` ($6/month)
- Scale up based on traffic
- Use Vultr's global regions for better performance
- Consider reserved instances for long-term deployments 