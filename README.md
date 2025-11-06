# 🏪 Natural Options POS & Accounting System

A comprehensive Point of Sale and accounting software with integrated inventory management, financial reporting, multi-location support, and complete business operations management.

## 🌟 Features

### 🏪 Point of Sale
- **💳 POS Terminal** - Touch-friendly interface for in-store sales
- **💰 Payment Processing** - Cash, card, and digital payment support
- **🧾 Receipt Printing** - Thermal printer integration
- **📱 Mobile POS** - Tablet and mobile-friendly interface
- **🔄 Real-time Sync** - Instant inventory and sales updates

### 📊 Accounting & Finance
- **📚 General Ledger** - Complete chart of accounts
- **💸 Accounts Receivable/Payable** - Customer and vendor management
- **📈 Financial Reports** - P&L, Balance Sheet, Cash Flow statements
- **🧮 Tax Management** - Sales tax calculation and reporting
- **💰 Multi-currency Support** - Handle multiple currencies

### 📦 Inventory & Operations
- **📦 Real-time Inventory** - Live stock tracking across locations
- **🏭 Multi-location Support** - Manage multiple stores/warehouses
- **👥 Employee Management** - Time tracking and role-based access
- **📊 Business Intelligence** - Advanced analytics and reporting
- **🔒 Security** - Role-based permissions and audit trails

## 🚀 Quick Start

### Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd natural-options-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Setup database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open application**
   ```
   http://localhost:3000
   ```

## 🚢 Production Deployment

### Deploy to VPS

**👉 START HERE:** See [`START_HERE.md`](./START_HERE.md) for complete deployment guide.

**Quick deployment:**
1. Run `git-setup.ps1` (Windows) or `git-setup.sh` (Linux/Mac) locally
2. Run `vps-setup.sh` on your VPS
3. Access your application at your domain

**Documentation:**
- 📖 [`START_HERE.md`](./START_HERE.md) - Start here for deployment
- ⚡ [`DEPLOYMENT_QUICK_START.md`](./DEPLOYMENT_QUICK_START.md) - Quick reference
- 📚 [`VPS_DEPLOYMENT_GUIDE.md`](./VPS_DEPLOYMENT_GUIDE.md) - Comprehensive guide
- ✅ [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) - Track your progress
- 📋 [`DEPLOYMENT_README.md`](./DEPLOYMENT_README.md) - File overview

## 📁 Project Structure

```
natural-options-admin/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   └── [lang]/            # Internationalized pages
│   ├── components/            # React components
│   ├── lib/                   # Utility libraries
│   │   ├── db/               # Database services
│   │   └── services/         # Business logic
│   ├── prisma/               # Database schema
│   ├── views/                # Page views
│   └── configs/              # Configuration files
├── woo-rental-bridge/        # WooCommerce integration
├── ecosystem.config.js       # PM2 configuration
├── deploy.sh                 # Deployment script
└── vps-setup.sh             # VPS setup script
```

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** Material-UI (MUI) 7
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **State Management:** Redux Toolkit
- **WooCommerce:** REST API integration
- **Process Manager:** PM2
- **Web Server:** Nginx

## 📝 Environment Variables

Required environment variables (see `.env.example`):

```env
# WooCommerce
WOO_STORE_URL=https://your-store.com
WOO_CONSUMER_KEY=ck_xxxxx
WOO_CONSUMER_SECRET=cs_xxxxx

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/naturaloptions

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Environment
NODE_ENV=development
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run migrate      # Run database migrations
```

## 📊 Database Management

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations (production)
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

## 🔄 Deployment Updates

After pushing changes to git:

```bash
# On VPS
cd /var/www/natural-options-admin
./deploy.sh
```

## 🆘 Troubleshooting

### Port already in use
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Database connection issues
```bash
# Test PostgreSQL connection
psql -U naturaloptions_user -d naturaloptions -h localhost
```

### View application logs
```bash
# Development
npm run dev

# Production (PM2)
pm2 logs natural-options-admin
```

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Documentation](https://mui.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)

## 🔒 Security

- Never commit `.env` files
- Use strong passwords for database
- Generate secure `NEXTAUTH_SECRET`
- Always use HTTPS in production
- Keep dependencies updated

## 📄 License

Commercial License

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📧 Support

For issues and questions, please check the deployment documentation or create an issue in the repository.

---

**Version:** 4.0.0  
**Last Updated:** October 29, 2025
