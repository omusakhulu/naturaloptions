# Natural Options — User Manual

## 1. Access & Navigation

All application pages are language-prefixed:
- Example: `/en/apps/...`

The sidebar shows pages based on your role (via role permissions / menu access). If you don’t see a page mentioned below, your role likely doesn’t have access.

## 2. Pages Guide (What’s on Each Page + How To Use)

### 2.1 Home / Dashboard
- **Home (Products Dashboard)** — `/{lang}/apps/ecommerce/dashboard`
  - **What it is:** the main dashboard with KPIs, sales/transactions summaries, and operational widgets.
  - **How to use:**
    - Use the date/period controls (if present) to change the reporting range.
    - Use refresh controls to re-fetch updated WooCommerce/DB data.

### 2.2 Products & Catalog
- **List Products** — `/{lang}/apps/ecommerce/products/list`
  - **What it is:** searchable product list synced from WooCommerce and enriched with local inventory fields.
  - **How to use:** search by name/SKU, open a product to view/edit, and review stock fields.

- **Add Product** — `/{lang}/apps/ecommerce/products/add`
  - **What it is:** create a new product entry (typically pushed/synced to WooCommerce depending on integration settings).
  - **How to use:** fill product basics (name, SKU, pricing, categories) then save.

- **Update Price** — `/{lang}/apps/ecommerce/products/update-price`
  - **What it is:** bulk or targeted price updates (where enabled).
  - **How to use:** locate products, apply new prices, then confirm changes.

- **Import Products** — `/{lang}/apps/ecommerce/products/import-products`
  - **What it is:** bulk import of products from a file (CSV/structured format).
  - **How to use:** upload the file, validate the preview, then run the import.

- **Import Opening Stock** — `/{lang}/apps/ecommerce/products/import-opening-stock`
  - **What it is:** initialize stock quantities for products.
  - **How to use:** upload opening stock file and confirm to apply initial stock.

- **Categories** — `/{lang}/apps/ecommerce/products/categories`
  - **What it is:** manage product categories.
  - **How to use:** create/edit categories and assign products accordingly.

- **Brands** — `/{lang}/apps/ecommerce/products/brands`
  - **What it is:** manage brands used for product organization.
  - **How to use:** create/update brand records, then assign brands to products.

- **Warranties** — `/{lang}/apps/ecommerce/products/warranties`
  - **What it is:** warranty configuration used by products (where enabled).
  - **How to use:** define warranty periods/terms and link them to products.

- **Promotions** — `/{lang}/apps/ecommerce/promotions` and `/{lang}/apps/ecommerce/promotions/create`
  - **What it is:** promotions/discount campaigns.
  - **How to use:** create a promotion, select applicable products/rules, activate, then monitor impact.

### 2.3 Orders & Customers (WooCommerce)
- **Orders List** — `/{lang}/apps/ecommerce/orders/list`
  - **What it is:** list of synced WooCommerce orders.
  - **How to use:** search/filter orders by number/customer/status; open an order to view details.

- **Order Details** — `/{lang}/apps/ecommerce/orders/details/[id]`
  - **What it is:** full order view: customer, line items, totals, and status.
  - **How to use:** review items for fulfillment, confirm shipping/billing details, and update operational fields where available.

- **Customers List** — `/{lang}/apps/ecommerce/customers/list`
  - **What it is:** list of customers (synced from WooCommerce).
  - **How to use:** search by name/email; open a customer for details.

- **Customer Details** — `/{lang}/apps/ecommerce/customers/details/[id]`
  - **What it is:** full customer profile including addresses.
  - **How to use:** review billing/shipping info and customer history.

### 2.4 Stock & Inventory Operations
- **Stock Management (Dual Stock)** — `/{lang}/apps/stock-management`
  - **What it is:** dual-stock overview (Actual vs Reserved vs Available vs Website).
  - **What’s on the page:**
    - KPIs: total products, low stock, out of stock, reserved stock
    - Product table with “needs sync” warnings
    - Actions: Adjust, Sync, Sync All
  - **How to use:**
    - Use **Adjust** to correct physical stock (with reason/notes).
    - Use **Sync** to push Available stock to WooCommerce.
    - Use **Sync All** during end-of-day or after major stock updates.

- **Stock Adjustment (Document-based)** — `/{lang}/apps/stock-adjustment`
  - **What it is:** create a stock adjustment record with a reference number, location, and line items.
  - **What’s on the page:** location selector, reference, date, adjustment type, item lines, amount recovered, reason.
  - **How to use:**
    - Select the business location.
    - Set adjustment type (increase/decrease/damage/correction).
    - Add item lines via product search, set quantities and (optional) unit prices.
    - Save to generate a stored adjustment record.

- **Stock Transfers** — `/{lang}/apps/stock-transfers`
  - **What it is:** move stock between locations (where implemented).
  - **How to use:** create a transfer, set from/to, add items, submit/complete.

### 2.5 Warehouses (Warehouse Stock System)
- **Warehouses List** — `/{lang}/apps/warehouses/list`
  - **What it is:** list of warehouses with search and status filtering.
  - **How to use:**
    - Use search to find by name/code/city.
    - Filter by status (active/inactive/maintenance).
    - Use actions to view, edit, or delete.

- **Add Warehouse** — `/{lang}/apps/warehouses/add`
  - **What it is:** create a new warehouse.
  - **How to use:** enter name/code, address/contact, capacity and status, then create.

- **Warehouse Details** — `/{lang}/apps/warehouses/[id]`
  - **What it is:** overview of a single warehouse including inventory and location bins.
  - **How to use:**
    - Review inventory items and warehouse locations.
    - Use **Manage Stock** to adjust stock movements.
    - Use **View Movements** to audit inbound/outbound/transfer/adjustments.

- **Manage Inventory** — `/{lang}/apps/warehouses/[id]/manage`
  - **What it is:** operational stock movement page for warehouse inventory items.
  - **How to use:**
    - Choose an item and apply movements: inbound/outbound/transfer/adjustment.
    - Add a reference number (PO/SO/ORDER) and notes for traceability.

- **Add Inventory Item** — `/{lang}/apps/warehouses/[id]/inventory`
  - **What it is:** add a product into a warehouse inventory list (with optional bin location).
  - **How to use:** select an existing product (auto-fills SKU/name/prices), set initial quantity and location, then save.

- **Warehouse Movements** — `/{lang}/apps/warehouses/[id]/movements`
  - **What it is:** stock movement history table.
  - **How to use:** filter by type (inbound/outbound/transfer/adjustment/return) and review references.

- **Edit Warehouse** — `/{lang}/apps/warehouses/edit/[id]`
  - **What it is:** update warehouse details and status.
  - **How to use:** edit fields and save.

### 2.6 Sales (Sell Module)
- **POS** — `/{lang}/apps/sell/pos`
  - **What it is:** the POS terminal UI.
  - **How to use:**
    - Add products to cart, confirm quantities.
    - Choose payment method(s), finalize sale.
    - If configured, stock is reduced and movements are recorded.

- **All Sales** — `/{lang}/apps/sell/sales`
  - **What it is:** sales history list (POS/other sales records where enabled).
  - **How to use:** filter by date/status and open a sale for details.

- **Sales Order** — `/{lang}/apps/sell/sales-order`
  - **What it is:** create/manage sales orders.
  - **How to use:** create an order, add items, confirm customer, and progress status.

- **Quotations** — `/{lang}/apps/sell/quotations` and `/{lang}/apps/sell/quotations/add`
  - **What it is:** prepare quotes for customers.
  - **How to use:** create a quotation, add items, set validity/terms, then send/print as needed.

- **Shipments** — `/{lang}/apps/sell/shipments`
  - **What it is:** track shipments for sales/orders.
  - **How to use:** assign shipment details and track status.

- **Discounts** — `/{lang}/apps/sell/discounts`
  - **What it is:** manage discount rules used during sales.
  - **How to use:** define discount rules and apply them during POS/quotation flows.

### 2.7 Purchases
- **Purchase Requisition** — `/{lang}/apps/purchases/requisition`
  - **What it is:** internal request to purchase items.
  - **How to use:** create requisition, add requested items, submit for approval.

- **Purchase Order** — `/{lang}/apps/purchases/order`
  - **What it is:** formal order to a vendor.
  - **How to use:** select vendor, add items, confirm quantities/prices, generate PO.

- **List Purchases** — `/{lang}/apps/purchases/list`
  - **What it is:** list of purchases and their status.
  - **How to use:** search/filter and open for details.

- **Add Purchase** — `/{lang}/apps/purchases/add`
  - **What it is:** record a purchase transaction.
  - **How to use:** enter vendor, items, totals and confirm to post.

- **Purchase Returns** — `/{lang}/apps/purchases/returns`
  - **What it is:** record returns back to vendors.
  - **How to use:** select the purchase/vendor, add return items and reason, then save.

### 2.8 Accounting & Payment Accounts
- **Accounting Dashboard** — `/{lang}/apps/accounting/dashboard`
  - **What it is:** accounting KPIs and quick links.

- **Chart of Accounts** — `/{lang}/apps/accounting/chart-of-accounts`
  - **What it is:** manage the account tree.
  - **How to use:** add accounts, set parent-child hierarchy, and mark active/inactive.

- **Journal Entries** — `/{lang}/apps/accounting/journal-entries`
  - **What it is:** create and review journal entries.
  - **How to use:** ensure total debit equals total credit before posting.

- **Transactions** — `/{lang}/apps/accounting/transactions`
  - **What it is:** view transaction listings.
  - **How to use:** filter by date/account/type.

- **Accounting Reports** — `/{lang}/apps/accounting/reports`
  - **What it is:** accounting report hub.

- **Financial Reports** — `/{lang}/apps/accounting/financial-reports`
  - **What it is:** balance sheet / P&L / cash flow style reports.

- **Vendors** — `/{lang}/apps/accounting/vendors`
  - **What it is:** manage vendor contacts and payment terms.

- **Payment Accounts** — `/{lang}/apps/payment-accounts` and subpages
  - **What it is:** account balances and statement-style reporting.
  - **Subpages:**
    - `/{lang}/apps/payment-accounts/balance-sheet`
    - `/{lang}/apps/payment-accounts/trial-balance`
    - `/{lang}/apps/payment-accounts/cash-flow`

### 2.9 Reports
- **Reports Hub** — `/{lang}/apps/reports`
  - **What it is:** central navigation into report pages.
  - **How to use:** pick a report type from the sidebar and apply date filters.

- **Report Pages** — `/{lang}/apps/reports/[slug]`
  - **What it is:** individual report views (profit/loss, stock, tax, activity log, etc.).
  - **How to use:** select time range and export if supported.

### 2.10 Logistics
- **Logistics Dashboard** — `/{lang}/apps/logistics/dashboard`
  - **What it is:** overview of deliveries/fleet status.

- **Fleet** — `/{lang}/apps/logistics/fleet`
  - **What it is:** manage vehicles and drivers.
  - **How to use:** add/update vehicles, assign drivers, track availability.

- **Assignments** — `/{lang}/apps/logistics/assignments`
  - **What it is:** schedule deliveries for orders.
  - **How to use:** create an assignment (order + driver + vehicle + schedule), then update status as the delivery progresses.

### 2.11 Users, Roles, and Settings
- **Users** — `/{lang}/apps/user/list`
  - **What it is:** manage system users.

- **Roles** — `/{lang}/apps/roles`
  - **What it is:** role definitions.

- **Permissions** — `/{lang}/apps/permissions`
  - **What it is:** permission assignments and access rules.

- **Account Settings** — `/{lang}/pages/account-settings`
  - **What it is:** user and UI settings.

## 3. Notes
Some pages like Email, Chat, Kanban, Calendar, and UI demo pages may exist in the codebase but may not be used for production operations.
