#!/bin/bash

# Git Setup Script for Linux/Mac/WSL
# This script helps you initialize and push your repository to GitHub/GitLab

echo "🚀 Omnishop Admin Dashboard - Git Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Git is installed: $(git --version)${NC}"

# Check if already initialized
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git repository already initialized${NC}"
else
    echo ""
    echo -e "${YELLOW}📦 Initializing Git repository...${NC}"
    git init
    echo -e "${GREEN}✅ Git repository initialized${NC}"
fi

# Add files
echo ""
echo -e "${YELLOW}📝 Adding files to git...${NC}"
git add .

# Commit
echo ""
read -p "Enter commit message [Initial commit - Omnishop Admin Dashboard]: " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-Initial commit - Omnishop Admin Dashboard}

git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✅ Files committed${NC}"

# Setup remote
echo ""
echo -e "${CYAN}🌐 Remote Repository Setup${NC}"
echo ""
read -p "Enter your Git repository URL (e.g., https://github.com/username/repo.git): " REMOTE_URL

if [ ! -z "$REMOTE_URL" ]; then
    # Check if remote exists
    if git remote get-url origin &> /dev/null; then
        echo -e "${YELLOW}⚠️  Updating existing remote${NC}"
        git remote set-url origin "$REMOTE_URL"
    else
        git remote add origin "$REMOTE_URL"
    fi
    
    echo -e "${GREEN}✅ Remote added: $REMOTE_URL${NC}"
    
    # Push to remote
    echo ""
    echo -e "${YELLOW}📤 Pushing to remote...${NC}"
    git branch -M main
    git push -u origin main
    
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to remote!${NC}"
else
    echo -e "${YELLOW}⏭️  Skipped remote setup${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Git setup complete!${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "${YELLOW}1. SSH into your VPS${NC}"
echo -e "${YELLOW}2. Run: wget https://raw.githubusercontent.com/YOUR_USERNAME/omnishop-admin/main/vps-setup.sh${NC}"
echo -e "${YELLOW}3. Run: chmod +x vps-setup.sh && ./vps-setup.sh${NC}"
echo ""
