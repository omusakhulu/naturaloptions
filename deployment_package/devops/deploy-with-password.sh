#!/bin/bash

# Natural Options - Deployment with Password Authentication
# This script handles password-based authentication for initial setup

set -e  # Exit on error

# Configuration
SERVER_IP="196.96.56.81"
SERVER_USER="root"
SERVER_PASS="MotherFuckerJones2026!"
APP_NAME="naturaloptions"
APP_PORT="3000"
DEPLOY_PATH="/var/www/naturaloptions"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Natural Options - Automated Deployment${NC}"
echo -e "${GREEN}    Target: ${SERVER_IP}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Installing sshpass for password authentication...${NC}"
    brew install hudochenkov/sshpass/sshpass || {
        echo -e "${RED}Failed to install sshpass. Please install it manually.${NC}"
        exit 1
    }
fi

# Function to execute commands on remote server with password
remote_exec() {
    sshpass -p "${SERVER_PASS}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "$1"
}

# Function to copy files with password
remote_copy() {
    sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no -r "$1" ${SERVER_USER}@${SERVER_IP}:"$2"
}

echo -e "\n${YELLOW}🔑 Testing connection to server...${NC}"
remote_exec "echo 'Connection successful!'"

echo -e "\n${GREEN}Connection established! Starting deployment...${NC}"

# Execute the main setup script remotely
echo -e "\n${YELLOW}📦 Copying setup scripts to server...${NC}"
remote_copy ./devops/fresh-vps-setup.sh /root/setup.sh
remote_copy ./devops/config.env /root/config.env
remote_copy ./ecosystem.config.js /root/ecosystem.config.js

echo -e "\n${YELLOW}🚀 Executing setup on server...${NC}"
remote_exec "chmod +x /root/setup.sh"

# Run the setup script on the server
remote_exec "bash /root/setup.sh"

echo -e "\n${GREEN}✅ Initial setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
