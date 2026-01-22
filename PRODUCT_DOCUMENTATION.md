# Natural Options — Product Documentation

## 1. Overview
Natural Options is a unified business operations platform that combines:
- Point of Sale (POS)
- Inventory & warehousing
- Accounting (double-entry)
- Order management (WooCommerce-backed)

It is implemented as a Next.js 15 application (App Router) with a PostgreSQL database managed via Prisma.

## 2. Intended Users & Stakeholders
- **Store operations:** cashiers, supervisors, branch managers
- **Back-office:** accountants, procurement staff, administrators
- **Logistics:** dispatchers, drivers, fleet managers
- **Management:** owners/executives needing KPI and financial reporting
- **Technical:** developers/DevOps maintaining deployments and integrations

## 3. How-To (Setup, Run, Deploy, and Common Tasks)

### 3.1 Run Locally (Development)
1. **Install dependencies**
   - Ensure you have Node.js installed.
   - Install packages:
     ```bash
     npm install
     ```
2. **Create your environment file**
   ```bash
   cp .env.example .env
   ```
3. **Set required environment variables**
   - Set `DATABASE_URL` for PostgreSQL.
   - Set WooCommerce credentials (`WOO_STORE_URL`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`) if you will sync with Woo.
   - Set NextAuth variables (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`).
4. **Generate Prisma Client**
   ```bash
   npx prisma generate --schema=./src/prisma/schema.prisma
   ```
5. **Apply database schema**
   - For development migrations:
     ```bash
     npm run migrate
     ```
   - If you prefer direct schema push (commonly used in scripts):
     ```bash
     npx prisma db push --schema=./src/prisma/schema.prisma
     ```
6. **(Optional) Seed the database**
   ```bash
   npm run seed
   ```
7. **Start the dev server**
   ```bash
   npm run dev
   ```
8. **Login**
   - Open the app in your browser and navigate to the login page.
   - To create an initial super admin user, run:
     ```bash
     node scripts/create-admin.js
     ```

### 3.2 Run in Production (PM2)
The production process manager configuration is in `ecosystem.config.js`.

Typical run flow on a server:
1. Configure `.env` (including `DATABASE_URL`, WooCommerce creds, NextAuth vars).
2. Install dependencies and build.
3. Start/restart using PM2.

### 3.3 Deploy to a VPS
This repo includes multiple deployment approaches.

#### 3.3.1 Incremental Deploy (sync + build on server)
Use `devops/deploy.sh` to:
- sync files
- install dependencies
- generate Prisma client
- build Next.js
- apply schema and seed
- restart PM2 and verify

#### 3.3.2 Fully Automated PostgreSQL Server Provision + Deploy
Use `devops/deploy-postgres-automated.sh` to:
- install system dependencies (Node, PM2, PostgreSQL, Nginx)
- recreate DB/user
- build locally and upload a tarball
- configure `.env` (including `DATABASE_URL`)
- install dependencies on server

### 3.4 Common Operational How-To

#### 3.4.1 Create a New User
- **Via UI:** create users from the admin user management screens (requires admin role).
- **Via API:** `POST /api/users` (requires an authenticated admin session).

#### 3.4.2 Make a POS Sale
1. Open the POS screen.
2. Add products (search/scan).
3. Apply discount/tax as needed.
4. Select payment method(s).
5. Complete the sale (this creates `POSSale`, `POSSaleItem`, and `Payment` records).

#### 3.4.3 Adjust or Sync Stock
Use the Stock Management UI (documented in `DUAL_STOCK_SYSTEM.md`).
If your build includes the stock API routes, you can also follow the `/api/stock/...` workflows described there.

#### 3.4.4 Create a Delivery Assignment
1. Ensure you have at least one `Driver` and `Vehicle`.
2. Create an assignment via UI, or via API:
   - `POST /api/logistics/assignments`
3. Track and update status via:
   - `PUT /api/logistics/assignments/[id]`

### 3.5 Troubleshooting Quick Checks
- **App not starting:** check PM2 logs (`pm2 logs <appName>`).
- **502 from Nginx:** verify PM2 is running and Nginx is proxying to the correct port.
- **Prisma errors:** ensure `DATABASE_URL` is correct and Prisma client was generated.

### 3.6 User Manual
For a page-by-page guide (what each page does and how to use it), see `USER_MANUAL.md`.

## 4. Product Capabilities (Functional View)

### 4.1 POS
- POS terminal sales entry and checkout
- Multiple payment methods (cash, card, digital wallet; mappings exist for region-specific methods)
- Parked sales (save and resume)
- Cash drawer management
- Refund processing

**Key models:** `POSTerminal`, `POSSale`, `POSSaleItem`, `ParkedSale`, `CashDrawer`, `Payment`, `Refund`, `POSCustomer`

### 4.2 Inventory & Warehousing
- Product catalog synced from WooCommerce
- Location-aware inventory tracking
- Warehouse locations (zone/aisle/rack/shelf/bin)
- Stock movements audit trail

**Key models:** `Product`, `Location`, `InventoryLocation`, `Warehouse`, `WarehouseLocation`, `InventoryItem`, `StockMovement`, `ProductStockMovement`

### 4.3 Dual Stock System (Core Differentiator)
Natural Options separates inventory into:
- **Actual stock**: physical inventory on hand (POS/warehouse)
- **Website stock**: quantity shown on WooCommerce
- **Reserved stock**: stock allocated for pending orders

**Available stock** is typically computed as:

`available = actualStock - reservedStock`

The repo also contains a dedicated document with operational and API guidance:
- `DUAL_STOCK_SYSTEM.md`

### 4.4 Accounting
- Chart of accounts (hierarchical)
- Journal entries and journal line items
- Vendors and bills
- Payment terms

**Key models:** `ChartOfAccounts`, `JournalEntry`, `JournalLineItem`, `Vendor`, `Bill`, `PaymentTerm`

### 4.5 Orders, Customers, Invoices, Packing
- Orders synced from WooCommerce
- Customer records synced from WooCommerce
- Invoices with independent invoice lifecycle
- Packing slips with delivery lifecycle

**Key models:** `Order`, `Customer`, `Invoice`, `PackingSlip`, `OrderNote`

### 4.6 Logistics & Fleet
- Drivers and vehicles
- Delivery assignments linked to orders
- Assignment scheduling and status tracking

**Key models:** `Driver`, `Vehicle`, `DeliveryAssignment`

### 4.7 Projects, Quotes, BOQ
- Project records linked to orders
- Crew/transport planning
- Event tent quoting
- BOQ and cost reporting

**Key models:** `Project`, `CrewDetail`, `Transport`, `EventTentQuote`, `BOQ`, `ProjectCostReport`

### 4.8 Audit Trail & Operational Traceability
- Activity logging records actions taken on entities

**Key model:** `ActivityLog` with `EntityType`

## 5. System Architecture (Technical View)

### 5.1 Tech Stack
- **Web framework:** Next.js 15 (App Router)
- **UI:** MUI (Material UI)
- **State management:** Redux Toolkit
- **Auth:** NextAuth + Prisma Adapter
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Process manager (prod):** PM2
- **Reverse proxy (prod):** Nginx

### 5.2 Frontend Structure
- Route entrypoints live under `src/app/`.
- Internationalization uses a `src/app/[lang]/...` structure.
- The private dashboard layout is defined in `src/app/[lang]/(dashboard)/(private)/layout.jsx` and wraps content with:
  - `Providers` (Redux, theme, nav context)
  - `AuthGuard` (requires authenticated session)
  - Layout wrapper selecting vertical/horizontal layout.

### 5.3 Backend/API Structure
API routes live under `src/app/api/...` and are implemented as standard Next.js route handlers.

Observed endpoints include (non-exhaustive):
- `/api/auth/signup` (create account)
- `/api/users` (admin-oriented user management)
- `/api/orders` (orders query + caching)
- `/api/customers` (WooCommerce + local DB)
- `/api/products` (products)
- `/api/pos/sales` (POS sales)
- `/api/logistics/assignments` and `/api/logistics/assignments/[id]` (delivery scheduling)

Authentication is enforced on many routes using `getServerSession(authOptions)`.

### 5.4 Data Layer
- Prisma schema is located at `src/prisma/schema.prisma`.
- Prisma client instantiation is handled in `src/lib/prisma.ts` (connection configuration + dev global reuse).

## 6. Data Model (High-Level)

### 6.1 Core Entities
- **Identity & auth:** `User`, `Account`, `Session`, `VerificationToken`
- **Commerce:** `Product`, `Order`, `Customer`
- **POS:** `POSSale`, `POSSaleItem`, `POSTerminal`, `CashDrawer`, `Payment`, `Refund`
- **Inventory:** `InventoryLocation`, `Warehouse`, `InventoryItem`, movement tables
- **Accounting:** `ChartOfAccounts`, `JournalEntry`, `Bill`, `Vendor`
- **Logistics:** `Driver`, `Vehicle`, `DeliveryAssignment`

### 6.2 Roles & Permissions
User roles are defined in the Prisma enum `UserRole`:
- `SUPER_ADMIN`
- `ADMIN`
- `MANAGER`
- `ACCOUNTANT`
- `CASHIER`
- `SALES`
- `USER`

## 7. Integration Model

### 7.1 WooCommerce
- Products, orders, and customers are synchronized through WooCommerce REST API credentials in environment variables.
- Some create/update flows write to WooCommerce first and then persist a local copy.

### 7.2 Operational Consistency
- The dual stock system is designed to prevent overselling and decouple retail operations from online storefront display.
- Stock movement tables provide auditability.

## 8. Deployment & DevOps

### 8.1 Local Development
Typical workflow:
1. Configure environment: copy `.env.example` to `.env` and set credentials.
2. Install dependencies.
3. Generate Prisma client and run migrations.
4. Start dev server.

See `README.md` for the canonical quick start.

### 8.2 Production Runtime
- PM2 runs the Next.js app, configured in `ecosystem.config.js`.
- The process is configured for **cluster mode** with multiple instances.

### 8.3 Deployment Automation
The repository includes deployment scripts under `devops/`.
A representative flow in `devops/deploy.sh`:
- Sync `.env` to server
- Rsync application files
- Remote install dependencies
- Generate Prisma client
- Build Next.js
- Push schema to DB
- Seed DB (if seed script exists)
- Restart PM2 and verify service

## 9. Operational Workflows (End-to-End)

### 9.1 POS Sale
1. Cashier adds items.
2. System creates `POSSale` and `POSSaleItem` rows.
3. Payment(s) recorded.
4. Inventory adjustments may be applied depending on stock workflow implementation.

### 9.2 Delivery Assignment
1. Dispatcher creates a `DeliveryAssignment` for an order.
2. Driver and vehicle statuses are updated.
3. Assignment progresses through status lifecycle.

### 9.3 Customer and Order Sync
1. Data is retrieved from WooCommerce.
2. Saved locally for reporting/search and operational workflows.

## 10. Security Considerations
- Avoid committing `.env` files.
- Use strong database credentials.
- Ensure `NEXTAUTH_SECRET` is set and rotated appropriately.
- Enforce HTTPS in production with Nginx where applicable.

## 11. Known Documentation Sources in Repo
- `README.md` — overview and quick start
- `START_HERE.md` — VPS deployment onboarding guide
- `VPS_DEPLOYMENT_GUIDE.md`, `DEPLOYMENT_CHECKLIST.md`, `DEPLOYMENT_README.md` — deployment details
- `DUAL_STOCK_SYSTEM.md` — dual stock concept, workflows, endpoints

## 12. Next Improvements (Suggested)
- Consolidate API documentation into a single reference (OpenAPI/Swagger).
- Add an architecture diagram and data flow diagrams for stock sync and POS sales.
- Add explicit “source of truth” rules (when DB vs WooCommerce wins) to prevent data drift.
- Add monitoring playbook (PM2 logs, Nginx logs, DB health checks).
