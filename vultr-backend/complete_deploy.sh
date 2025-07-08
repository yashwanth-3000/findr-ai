#!/bin/bash

# Complete Findr AI Vultr Deployment Script
# 1. Delete all existing instances
# 2. Create new findr-ai instance  
# 3. Deploy with HTTPS support

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Complete Findr AI Vultr Deployment${NC}"
echo "========================================"

# Check if API key is set
if [ -z "$VULTR_API_KEY" ]; then
    echo -e "${RED}❌ Error: VULTR_API_KEY environment variable not set${NC}"
    echo "Please run: export VULTR_API_KEY=\"your-api-key\""
    exit 1
fi

# Check if vultr-cli is installed
if ! command -v vultr-cli &> /dev/null; then
    echo -e "${RED}❌ Error: vultr-cli not found${NC}"
    echo "Install with: brew install vultr/vultr-cli/vultr-cli"
    exit 1
fi

# Step 1: List and delete all existing instances
echo -e "${YELLOW}🗑️  Step 1: Checking for existing instances...${NC}"
INSTANCES=$(vultr-cli instance list --output json 2>/dev/null || echo "[]")

if [ "$INSTANCES" = "[]" ] || [ -z "$INSTANCES" ]; then
    echo -e "${GREEN}✅ No existing instances found${NC}"
else
    echo "Found existing instances:"
    vultr-cli instance list
    echo ""
    
    # Get instance IDs
    INSTANCE_IDS=$(echo "$INSTANCES" | jq -r '.[].id' 2>/dev/null || true)
    
    if [ -n "$INSTANCE_IDS" ]; then
        echo -e "${YELLOW}🗑️  Deleting existing instances...${NC}"
        while IFS= read -r instance_id; do
            if [ -n "$instance_id" ]; then
                echo "   Deleting instance: $instance_id"
                vultr-cli instance delete "$instance_id" --force
                echo -e "${GREEN}   ✅ Deleted: $instance_id${NC}"
            fi
        done <<< "$INSTANCE_IDS"
        
        # Wait for deletions to complete
        echo -e "${YELLOW}⏳ Waiting for deletions to complete...${NC}"
        sleep 10
    fi
fi

echo ""
echo -e "${GREEN}✅ Step 1 Complete: All existing instances deleted${NC}"
echo ""

# Step 2 & 3: Deploy new instance
echo -e "${YELLOW}🚀 Step 2 & 3: Creating and deploying new findr-ai instance...${NC}"
echo ""

# Run the main deployment script
bash deploy.sh

echo ""
echo -e "${GREEN}🎉 Complete deployment finished successfully!${NC}"
echo -e "${BLUE}Your Findr AI API is ready to use! 🚀${NC}" 