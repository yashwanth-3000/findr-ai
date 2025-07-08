#!/bin/bash

# FastAPI Resume Analyzer Vultr Deployment Script
# Deploy production-ready resume analyzer with AI capabilities

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="blr"                    # Bangalore
PLAN="vc2-2c-4gb"              # 2 vCPU, 4GB RAM (upgraded for AI workloads)
OS="2284"                      # Ubuntu 24.04 LTS
LABEL="findr-ai"               # Changed from "resume-analyzer-prod" to "findr-ai"
PROJECT_DIR="vultr-backend"
SSH_KEY_ID="4b5eed74-8f4a-4318-b83c-3a426dcdc6ec"  # Vultr SSH key ID
SSH_PRIVATE_KEY="$HOME/.ssh/vultr_key"              # Local SSH private key

echo -e "${BLUE}🚀 Resume Analyzer Vultr Deployment Script${NC}"
echo "=============================================="

# Check if API key is set
if [ -z "$VULTR_API_KEY" ]; then
    echo -e "${RED}❌ Error: VULTR_API_KEY environment variable not set${NC}"
    echo "Please run: export VULTR_API_KEY=\"your-api-key\""
    exit 1
fi

# Check if vultr-cli is installed
if ! command -v vultr-cli &> /dev/null; then
    echo -e "${RED}❌ Error: vultr-cli not found${NC}"
    echo "Install with: brew install go && go install github.com/vultr/vultr-cli/v2@latest"
    exit 1
fi

# Check if required files exist
echo -e "${YELLOW}📋 Checking required files...${NC}"
required_files=(
    "main.py"
    "pdf_multi_crew_resume_analyzer.py"
    "requirements.txt"
    ".env"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Required file missing: $file${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Found: $file${NC}"
done

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Region: $REGION"
echo "  Plan: $PLAN (upgraded for AI workloads)"
echo "  OS: Ubuntu 24.04 LTS"
echo "  Label: $LABEL"
echo "  SSH Key ID: $SSH_KEY_ID"
echo ""

# Create instance
echo -e "${BLUE}🏗️  Creating Vultr instance...${NC}"
INSTANCE_OUTPUT=$(vultr-cli instance create \
  --region "$REGION" \
  --plan "$PLAN" \
  --os "$OS" \
  --label "$LABEL" \
  --ssh-keys "$SSH_KEY_ID")

INSTANCE_ID=$(echo "$INSTANCE_OUTPUT" | grep "^ID" | awk '{print $2}')

if [ -z "$INSTANCE_ID" ]; then
    echo -e "${RED}❌ Failed to create instance${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Instance created with ID: $INSTANCE_ID${NC}"

# Wait for instance to be ready
echo -e "${YELLOW}⏳ Waiting for instance to be ready...${NC}"
while true; do
    INSTANCE_INFO=$(vultr-cli instance get "$INSTANCE_ID")
    STATUS=$(echo "$INSTANCE_INFO" | grep "^STATUS" | awk '{print $2}')
    if [ "$STATUS" = "active" ]; then
        break
    fi
    echo "   Status: $STATUS - waiting..."
    sleep 10
done

# Get IP address
SERVER_IP=$(echo "$INSTANCE_INFO" | grep "^MAIN IP" | awk '{print $3}')

echo -e "${GREEN}✅ Instance is ready!${NC}"
echo "   Instance ID: $INSTANCE_ID"
echo "   IP Address: $SERVER_IP"
echo ""

# Wait for SSH to be ready
echo -e "${YELLOW}⏳ Waiting for SSH to be ready...${NC}"
while ! nc -z "$SERVER_IP" 22; do
    echo "   SSH not ready yet, waiting..."
    sleep 10
done

echo -e "${GREEN}✅ SSH is ready!${NC}"

# Wait a bit more for the system to fully boot
echo -e "${YELLOW}⏳ Allowing system to fully boot...${NC}"
sleep 30

# Copy files to server
echo -e "${BLUE}📁 Copying application files to server...${NC}"
scp -i "$SSH_PRIVATE_KEY" -o StrictHostKeyChecking=no -r . root@"$SERVER_IP":/opt/findr-ai

# Deploy the application
echo -e "${BLUE}🐳 Setting up Findr AI Application...${NC}"
ssh -i "$SSH_PRIVATE_KEY" -o StrictHostKeyChecking=no root@"$SERVER_IP" << 'EOF'
# Update system
echo "📦 Updating system packages..."
apt-get update -y

# Install essential tools including curl for GitIngest
echo "🔧 Installing essential system tools..."
apt-get install -y curl wget git build-essential

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already available"
fi

# Install Python 3.11 and pip
echo "🐍 Installing Python 3.11..."
apt-get install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt-get update -y
apt-get install -y python3.11 python3.11-pip python3.11-venv python3.11-dev

# Create virtual environment
cd /opt/findr-ai
echo "🔧 Setting up Python environment..."
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create systemd service
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/findr-ai.service << 'SERVICE_EOF'
[Unit]
Description=Findr AI API
After=network.target

[Service]
Type=exec
User=root
WorkingDirectory=/opt/findr-ai
Environment=PATH=/opt/findr-ai/venv/bin
ExecStart=/opt/findr-ai/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable findr-ai
systemctl start findr-ai

# Install and configure Nginx as reverse proxy
echo "🌐 Setting up Nginx reverse proxy..."
apt-get install -y nginx

cat > /etc/nginx/sites-available/findr-ai << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
NGINX_EOF

# Enable the site
ln -sf /etc/nginx/sites-available/findr-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Install Certbot for SSL certificates
echo "🔒 Installing SSL certificates..."
apt-get install -y snapd
snap install core; snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# Note: SSL setup will be completed after getting domain name
echo "📝 SSL setup ready - will configure after domain is pointed to server"

# Set up firewall
echo "🔒 Configuring firewall..."
ufw --force enable
ufw allow 22
ufw allow 80
ufw allow 443

echo "✅ Findr AI deployment completed!"
EOF

# Wait for application to start
echo -e "${YELLOW}⏳ Waiting for application to start...${NC}"
sleep 30

# Test the deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"

# Test health endpoint
echo "Testing health endpoint..."
for i in {1..5}; do
    if curl -s --max-time 10 "http://$SERVER_IP/health" | grep -q "healthy\|status"; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
        break
    else
        echo "   Attempt $i/5 failed, retrying..."
        sleep 10
    fi
done

# Test root endpoint
echo "Testing root endpoint..."
if curl -s --max-time 10 "http://$SERVER_IP/" | grep -q "Resume Analyzer\|API"; then
    echo -e "${GREEN}✅ Root endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️ Root endpoint may not be responding yet${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=============================================="

echo -e "${YELLOW}📝 Access your Findr AI API:${NC}"
echo "   🌐 API: http://$SERVER_IP/"
echo "   📚 Docs: http://$SERVER_IP/docs"
echo "   🔍 ReDoc: http://$SERVER_IP/redoc"
echo "   ❤️ Health: http://$SERVER_IP/health"
echo ""
echo -e "${YELLOW}🖥️  Server Details:${NC}"
echo "   Instance ID: $INSTANCE_ID"
echo "   IP Address: $SERVER_IP"
echo "   SSH: ssh root@$SERVER_IP"
echo ""
echo -e "${YELLOW}🔧 Management Commands:${NC}"
echo "   View logs: ssh root@$SERVER_IP 'journalctl -u findr-ai -f'"
echo "   Restart service: ssh root@$SERVER_IP 'systemctl restart findr-ai'"
echo "   Check status: ssh root@$SERVER_IP 'systemctl status findr-ai'"
echo "   Delete instance: vultr-cli instance delete $INSTANCE_ID"
echo ""
echo -e "${YELLOW}🔒 HTTPS Setup (After pointing domain):${NC}"
echo "   1. Point your domain to IP: $SERVER_IP"
echo "   2. Update Nginx config: ssh root@$SERVER_IP 'nano /etc/nginx/sites-available/findr-ai'"
echo "   3. Get SSL cert: ssh root@$SERVER_IP 'certbot --nginx -d yourdomain.com'"
echo "   4. Test renewal: ssh root@$SERVER_IP 'certbot renew --dry-run'"
echo ""
echo -e "${RED}⚠️ Important: Configure API Keys${NC}"
echo "   Edit .env file on server with valid API keys:"
echo "   ssh root@$SERVER_IP 'nano /opt/findr-ai/.env'"
echo "   Then restart: ssh root@$SERVER_IP 'systemctl restart findr-ai'"
echo ""
echo -e "${BLUE}Happy analyzing! 🚀${NC}" 