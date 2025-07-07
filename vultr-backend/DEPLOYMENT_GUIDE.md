# FastAPI Vultr Deployment Guide - Complete Process Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Deployment Process](#step-by-step-deployment-process)
4. [Errors Encountered & Solutions](#errors-encountered--solutions)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Production Optimization](#production-optimization)
7. [Monitoring & Maintenance](#monitoring--maintenance)

## Overview

This document provides a comprehensive guide for deploying a FastAPI application to Vultr Cloud Infrastructure, including all errors encountered during the process and their solutions.

**Final Result**: Successfully deployed FastAPI application accessible at http://139.84.153.96/

## Prerequisites

### System Requirements
- macOS/Linux development machine
- Internet connection
- Terminal/Command line access

### Required Tools
1. **Homebrew** (macOS package manager)
2. **Go** (>= 1.20) - for vultr-cli installation
3. **vultr-cli** - Vultr command line interface
4. **SSH client** - for server access
5. **curl** - for API testing

### Account Requirements
- Vultr account with API access
- Valid API key from Vultr dashboard

## Step-by-Step Deployment Process

### Phase 1: Local Development Setup

#### 1.1 Create Project Structure
```bash
mkdir vultr-backend
cd vultr-backend
```

#### 1.2 Create FastAPI Application (`main.py`)
- Basic FastAPI application with CRUD operations
- Health check endpoints
- CORS middleware
- Pydantic models for data validation

#### 1.3 Create Dependencies (`requirements.txt`)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
requests==2.31.0
```

#### 1.4 Create Documentation (`README.md`)
- Comprehensive usage instructions
- API endpoint documentation
- Deployment instructions

### Phase 2: Vultr CLI Installation

#### 2.1 Install Homebrew (if not present)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2.2 Install Go Programming Language
```bash
brew install go
```

#### 2.3 Install Vultr CLI
```bash
go install github.com/vultr/vultr-cli/v2@latest
```

#### 2.4 Configure PATH
```bash
export PATH=$PATH:~/go/bin
```

### Phase 3: Vultr Account Setup

#### 3.1 Set API Key
```bash
export VULTR_API_KEY="YOUR_API_KEY_HERE"
```

#### 3.2 Verify CLI Installation
```bash
vultr-cli version
```

### Phase 4: Infrastructure Deployment

#### 4.1 Research Available Options
```bash
# Check available regions
vultr-cli regions list | grep -i bangalore

# Check available OS options
vultr-cli os list | grep -i ubuntu

# Check available plans
vultr-cli plans list | grep vc2-1c-1gb
```

#### 4.2 Create Vultr Instance
```bash
vultr-cli instance create \
  --region blr \
  --plan vc2-1c-1gb \
  --os 2284 \
  --label fastapi-demo
```

#### 4.3 Wait for Instance to be Ready
```bash
# Monitor status
vultr-cli instance get <INSTANCE_ID>

# Wait for STATUS: active
```

#### 4.4 Get Instance IP Address
```bash
vultr-cli instance get <INSTANCE_ID> | grep "^MAIN IP"
```

### Phase 5: Application Deployment

#### 5.1 Wait for SSH to be Ready
```bash
nc -z <SERVER_IP> 22
```

#### 5.2 Copy Application Files
```bash
scp -o StrictHostKeyChecking=no -r . root@<SERVER_IP>:/opt/myapi
```

#### 5.3 SSH and Install Docker
```bash
ssh -o StrictHostKeyChecking=no root@<SERVER_IP>

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker
```

#### 5.4 Deploy FastAPI Container
```bash
cd /opt/myapi

docker run -d --name fastapi \
  -p 80:80 \
  -e MODULE_NAME=main \
  -e PORT=80 \
  -v /opt/myapi:/app \
  tiangolo/uvicorn-gunicorn-fastapi:python3.11
```

#### 5.5 Verify Deployment
```bash
docker ps | grep fastapi
docker logs fastapi
```

### Phase 6: Testing

#### 6.1 Test API Endpoints
```bash
curl http://<SERVER_IP>/
curl http://<SERVER_IP>/health
curl http://<SERVER_IP>/docs
```

## Errors Encountered & Solutions

### Error 1: vultr-cli Not Found in Homebrew

**Error Message:**
```
Warning: No available formula with the name "vultr-cli". Did you mean vault-cli?
```

**Cause:** vultr-cli is not available in Homebrew repositories.

**Solution:**
Install using Go package manager instead:
```bash
brew install go
go install github.com/vultr/vultr-cli/v2@latest
export PATH=$PATH:~/go/bin
```

### Error 2: Incorrect OS ID

**Error Message:**
```
error creating instance : {"error":"Cannot add instance. Specified os_id not available","status":400}
```

**Cause:** Used OS ID 387 which was not available in the Bangalore region.

**Investigation:**
```bash
vultr-cli os list | grep -i ubuntu
```

**Solution:**
- Found correct OS ID for Ubuntu 24.04 LTS: 2284
- Updated deployment script with correct OS ID

### Error 3: Incorrect vultr-cli Command Syntax

**Error Message:**
```
Error: unknown flag: --output
Error: unknown flag: --id
```

**Cause:** The vultr-cli version 2.22.0 has different command syntax than expected.

**Investigation:**
- Tested commands manually to understand output format
- Read help documentation: `vultr-cli instance --help`

**Solution:**
Updated script commands:
```bash
# Instead of:
vultr-cli instance create --output json
vultr-cli instance get --id <ID>

# Use:
vultr-cli instance create
vultr-cli instance get <ID>
```

### Error 4: Docker Image Pull Failed

**Error Message:**
```
docker: Error response from daemon: Head "https://ghcr.io/v2/tiangolo/uvicorn-gunicorn-fastapi/manifests/python3.11": denied
```

**Cause:** The GitHub Container Registry (ghcr.io) URL was incorrect or inaccessible.

**Solution:**
Used the standard Docker Hub image instead:
```bash
# Instead of:
ghcr.io/tiangolo/uvicorn-gunicorn-fastapi:python3.11

# Use:
tiangolo/uvicorn-gunicorn-fastapi:python3.11
```

### Error 5: Instance Deletion Failed

**Error Message:**
```
error deleting instance : gave up after 4 attempts, last error: "Unable to destroy server: This subscription is not currently active, you cannot destroy it."
```

**Cause:** Attempted to delete instance while it was still in "pending" status.

**Solution:**
- Wait for instance to reach "active" status before deletion
- Or let it complete initialization first

### Error 6: SSH Connection Issues

**Potential Issues:**
- SSH service not ready immediately after instance creation
- Firewall blocking SSH access
- Instance not fully booted

**Solution:**
```bash
# Wait for SSH to be ready
while ! nc -z <SERVER_IP> 22; do
    echo "SSH not ready yet, waiting..."
    sleep 10
done

# Use StrictHostKeyChecking=no for automation
ssh -o StrictHostKeyChecking=no root@<SERVER_IP>
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: "Connection refused" when testing API

**Symptoms:**
```bash
curl: (7) Failed to connect to IP port 80: Connection refused
```

**Debugging Steps:**
1. Check if container is running:
   ```bash
   ssh root@<SERVER_IP> 'docker ps'
   ```

2. Check container logs:
   ```bash
   ssh root@<SERVER_IP> 'docker logs fastapi'
   ```

3. Check if port 80 is accessible:
   ```bash
   ssh root@<SERVER_IP> 'netstat -tlnp | grep :80'
   ```

**Solutions:**
- Restart the container: `docker restart fastapi`
- Check firewall rules
- Verify container port mapping

#### Issue: "Module not found" errors in container

**Symptoms:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Causes:**
- requirements.txt not properly mounted
- Wrong working directory in container
- Dependencies not installed

**Solutions:**
1. Verify volume mount:
   ```bash
   docker exec fastapi ls -la /app
   ```

2. Install dependencies manually:
   ```bash
   docker exec fastapi pip install -r /app/requirements.txt
   ```

3. Rebuild container with proper Dockerfile

#### Issue: API returns 404 for all endpoints

**Symptoms:**
- Container running but all endpoints return 404
- No application logs visible

**Debugging:**
1. Check if main.py is in correct location:
   ```bash
   docker exec fastapi ls -la /app
   ```

2. Check container environment variables:
   ```bash
   docker exec fastapi env | grep MODULE_NAME
   ```

3. Manually test inside container:
   ```bash
   docker exec -it fastapi python -c "import main; print(main.app)"
   ```

#### Issue: High memory usage or container crashes

**Symptoms:**
- Container stops unexpectedly
- High memory usage
- OOM (Out of Memory) errors

**Solutions:**
1. Monitor resource usage:
   ```bash
   ssh root@<SERVER_IP> 'docker stats fastapi'
   ```

2. Upgrade instance plan:
   ```bash
   vultr-cli instance upgrade <INSTANCE_ID> --plan vc2-2c-4gb
   ```

3. Optimize application code
4. Add memory limits to container:
   ```bash
   docker run --memory="512m" ...
   ```

### Performance Optimization

#### 1. Instance Sizing
- **Development**: vc2-1c-1gb ($6/month)
- **Production**: vc2-2c-4gb ($24/month) or higher
- **High Traffic**: vc2-4c-8gb ($48/month)

#### 2. Database Optimization
- Use Vultr Managed Database for production
- Implement connection pooling
- Add database indexing

#### 3. Caching
- Implement Redis caching
- Use CDN for static content
- Add HTTP caching headers

#### 4. Security Hardening
```bash
# Disable root SSH login
echo "PermitRootLogin no" >> /etc/ssh/sshd_config

# Create non-root user
adduser appuser
usermod -aG docker appuser

# Enable firewall
ufw enable
ufw allow 22
ufw allow 80
ufw allow 443
```

### Monitoring and Logging

#### 1. Application Logs
```bash
# View real-time logs
ssh root@<SERVER_IP> 'docker logs -f fastapi'

# Save logs to file
ssh root@<SERVER_IP> 'docker logs fastapi > /var/log/fastapi.log'
```

#### 2. System Monitoring
```bash
# Check system resources
ssh root@<SERVER_IP> 'htop'
ssh root@<SERVER_IP> 'df -h'
ssh root@<SERVER_IP> 'free -m'
```

#### 3. Health Check Automation
```bash
# Create health check script
#!/bin/bash
HEALTH_URL="http://<SERVER_IP>/health"
if ! curl -f $HEALTH_URL > /dev/null 2>&1; then
    echo "Health check failed, restarting container..."
    ssh root@<SERVER_IP> 'docker restart fastapi'
fi
```

### Backup and Recovery

#### 1. Application Backup
```bash
# Backup application files
ssh root@<SERVER_IP> 'tar -czf /tmp/app-backup.tar.gz /opt/myapi'
scp root@<SERVER_IP>:/tmp/app-backup.tar.gz ./backups/
```

#### 2. Container Image Backup
```bash
# Save container image
ssh root@<SERVER_IP> 'docker save tiangolo/uvicorn-gunicorn-fastapi:python3.11 > /tmp/fastapi-image.tar'
```

#### 3. Instance Snapshot
```bash
# Create Vultr snapshot
vultr-cli snapshot create-instance --id <INSTANCE_ID> --label "fastapi-backup-$(date +%Y%m%d)"
```

## Production Deployment Checklist

### Pre-Deployment
- [ ] Test application locally
- [ ] Verify all dependencies in requirements.txt
- [ ] Run security scan on code
- [ ] Prepare deployment scripts
- [ ] Set up monitoring tools

### Deployment
- [ ] Create production instance with appropriate size
- [ ] Configure firewall rules
- [ ] Set up domain and SSL certificate
- [ ] Deploy application with production settings
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting

### Post-Deployment
- [ ] Verify all endpoints working
- [ ] Test error handling
- [ ] Monitor performance metrics
- [ ] Set up log rotation
- [ ] Document API for team

### Security Checklist
- [ ] Disable root SSH login
- [ ] Use SSH keys instead of passwords
- [ ] Enable firewall with minimal required ports
- [ ] Implement rate limiting
- [ ] Set up SSL/HTTPS
- [ ] Regular security updates
- [ ] Monitor access logs

## Cost Optimization Tips

1. **Right-sizing**: Start small and scale up based on actual usage
2. **Reserved Instances**: Consider Vultr reserved pricing for long-term deployments  
3. **Regional Selection**: Choose regions close to your users
4. **Resource Monitoring**: Regularly review CPU/memory usage
5. **Load Balancing**: Use multiple smaller instances instead of one large instance

## Support and Resources

### Vultr Documentation
- [Vultr API Documentation](https://www.vultr.com/api/)
- [Vultr CLI Documentation](https://github.com/vultr/vultr-cli)

### FastAPI Resources
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Docker Image Documentation](https://github.com/tiangolo/uvicorn-gunicorn-fastapi-docker)

### Troubleshooting Commands
```bash
# Instance management
vultr-cli instance list
vultr-cli instance get <ID>
vultr-cli instance restart <ID>

# Docker management
docker ps -a
docker logs <container>
docker restart <container>
docker exec -it <container> bash

# System diagnostics
ssh root@<IP> 'systemctl status docker'
ssh root@<IP> 'netstat -tlnp'
ssh root@<IP> 'ps aux | grep python'
```

This comprehensive guide should help you successfully deploy FastAPI applications to Vultr and troubleshoot any issues that arise during the process. 