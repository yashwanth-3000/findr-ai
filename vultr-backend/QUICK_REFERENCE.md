# FastAPI Vultr Deployment - Quick Reference

## 🚀 Working Commands (Copy & Paste Ready)

### 1. Install Prerequisites
```bash
# Install Go
brew install go

# Install vultr-cli
go install github.com/vultr/vultr-cli/v2@latest

# Add to PATH (add to your ~/.zshrc or ~/.bashrc)
export PATH=$PATH:~/go/bin
```

### 2. Set API Key
```bash
export VULTR_API_KEY="YOUR_API_KEY_HERE"
```

### 3. Create Instance
```bash
# Create instance in Bangalore
vultr-cli instance create \
  --region blr \
  --plan vc2-1c-1gb \
  --os 2284 \
  --label fastapi-demo

# Get instance ID and IP
vultr-cli instance list
vultr-cli instance get <INSTANCE_ID>
```

### 4. Deploy Application
```bash
# Set your server IP
SERVER_IP="YOUR_SERVER_IP"

# Wait for SSH
while ! nc -z $SERVER_IP 22; do echo "Waiting for SSH..."; sleep 10; done

# Copy files
scp -o StrictHostKeyChecking=no -r . root@$SERVER_IP:/opt/myapi

# Deploy
ssh -o StrictHostKeyChecking=no root@$SERVER_IP "
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Deploy FastAPI
cd /opt/myapi
docker run -d --name fastapi \
  -p 80:80 \
  -e MODULE_NAME=main \
  -e PORT=80 \
  -v /opt/myapi:/app \
  tiangolo/uvicorn-gunicorn-fastapi:python3.11
"
```

### 5. Test Deployment
```bash
curl http://$SERVER_IP/
curl http://$SERVER_IP/health
curl http://$SERVER_IP/docs
```

## 📝 Key Points That Worked

### ✅ Correct Values
- **OS ID**: 2284 (Ubuntu 24.04 LTS)
- **Region**: blr (Bangalore)
- **Plan**: vc2-1c-1gb
- **Docker Image**: `tiangolo/uvicorn-gunicorn-fastapi:python3.11`

### ❌ Common Mistakes
- **Wrong OS ID**: 387 (doesn't exist)
- **Wrong Docker Image**: `ghcr.io/tiangolo/...` (access denied)
- **Wrong CLI syntax**: `--output json`, `--id` flags don't exist in v2.22.0

### 🔧 Useful Commands
```bash
# Check available options
vultr-cli regions list | grep bangalore
vultr-cli os list | grep ubuntu
vultr-cli plans list | grep vc2-1c-1gb

# Monitor deployment
ssh root@$SERVER_IP 'docker logs fastapi'
ssh root@$SERVER_IP 'docker ps'

# Restart if needed
ssh root@$SERVER_IP 'docker restart fastapi'

# Clean up
vultr-cli instance delete <INSTANCE_ID>
```

## 💰 Cost Summary
- **Instance**: $6/month (vc2-1c-1gb)
- **Bandwidth**: 1TB included
- **Setup Time**: ~10 minutes
- **Total**: ~$6/month for basic FastAPI deployment

## 🌐 Access URLs (Replace with your IP)
- **API**: http://139.84.153.96/
- **Docs**: http://139.84.153.96/docs
- **Health**: http://139.84.153.96/health 