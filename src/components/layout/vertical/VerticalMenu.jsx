// React Imports
import { useEffect, useMemo, useState } from 'react'

// Next Imports
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'
import CustomChip from '@core/components/mui/Chip'

// import { GenerateVerticalMenu } from '@components/GenerateMenu'
// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ dictionary, scrollMenu }) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const params = useParams()
  const { data: session } = useSession()

  const [menuAccessMap, setMenuAccessMap] = useState(null)

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const { lang: locale } = params
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  const role = session?.user?.role

  useEffect(() => {
    const fetchMenuAccess = async () => {
      try {
        const res = await fetch('/api/roles/menu-access')

        if (!res.ok) {
          setMenuAccessMap({})

          return
        }

        const json = await res.json().catch(() => ({}))

        setMenuAccessMap(json?.map || {})
      } catch {
        setMenuAccessMap({})
      }
    }

    fetchMenuAccess()
  }, [])

  const allowedKeysSet = useMemo(() => {
    if (!role || role === 'SUPER_ADMIN') return null
    if (!menuAccessMap || typeof menuAccessMap !== 'object') return null

    const roleKeys = menuAccessMap[role]

    if (!Array.isArray(roleKeys)) return null

    return new Set(roleKeys)
  }, [menuAccessMap, role])

  const can = key => {
    if (!role) return false
    if (role === 'SUPER_ADMIN') return true

    // If this role is not restricted, allow all.
    if (!allowedKeysSet) return true

    return allowedKeysSet.has(key)
  }

  const canAny = keys => keys.some(k => can(k))

  const showProducts = canAny([
    'products.dashboard',
    'products.list',
    'products.add',
    'products.updatePrice',
    'products.importProducts',
    'products.importOpeningStock',
    'products.categories',
    'products.brands',
    'products.warranties',
    'products.stockAdjustment',
    'orders.list',
    'brands.list',
    'promotions.list',
    'promotions.create'
  ])

  const showUserManagement = canAny(['users.list', 'users.roles', 'users.permissions'])
  const showContacts = canAny(['contacts.customers', 'contacts.vendors'])
  const showPurchases = canAny([
    'purchases.requisition',
    'purchases.order',
    'purchases.list',
    'purchases.add',
    'purchases.returns'
  ])
  const showBI = canAny(['bi.dashboard', 'bi.insights', 'bi.analytics'])
  const showSell = canAny([
    'sell.salesOrder',
    'sell.allSales',
    'sell.posList',
    'sell.pos',
    'sell.quotationsAdd',
    'sell.quotationsList',
    'sell.returns',
    'sell.shipments',
    'sell.discounts'
  ])
  const showPaymentAccounts = canAny([
    'paymentAccounts.accounts',
    'paymentAccounts.balanceSheet',
    'paymentAccounts.trialBalance',
    'paymentAccounts.cashFlow'
  ])
  const showAccounting = canAny([
    'accounting.dashboard',
    'accounting.chartOfAccounts',
    'accounting.journalEntries',
    'accounting.transactions',
    'accounting.reports',
    'accounting.financialReports',
    'accounting.vendors'
  ])
  const showReports = canAny([
    'reports.profitLoss',
    'reports.purchaseSale',
    'reports.tax',
    'reports.supplierCustomer',
    'reports.customerGroups',
    'reports.stock',
    'reports.stockExpiry',
    'reports.lot',
    'reports.stockAdjustment',
    'reports.trendingProducts',
    'reports.items',
    'reports.productPurchase',
    'reports.productSell',
    'reports.purchasePayment',
    'reports.sellPayment',
    'reports.expense',
    'reports.register',
    'reports.salesRepresentative',
    'reports.activityLog'
  ])

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      ></Menu>
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <MenuSection label='Natural Options'>
          {can('home') && (
            <MenuItem icon={<i className='tabler-home' />} href={`/${locale}/apps/ecommerce/dashboard`}>
              Home
            </MenuItem>
          )}

          {showProducts && (
            <SubMenu label={dictionary['navigation'].products} icon={<i className='tabler-shopping-cart' />}>
              {can('products.dashboard') && (
                <MenuItem href={`/${locale}/apps/ecommerce/dashboard`}>{dictionary['navigation'].dashboard}</MenuItem>
              )}

              {canAny([
                'products.list',
                'products.add',
                'products.updatePrice',
                'products.importProducts',
                'products.importOpeningStock',
                'products.categories',
                'products.brands',
                'products.warranties',
                'products.stockAdjustment'
              ]) && (
                <SubMenu label='Products'>
                  {can('products.list') && (
                    <MenuItem href={`/${locale}/apps/ecommerce/products/list`}>List Products</MenuItem>
                  )}
                  {can('products.add') && (
                    <MenuItem href={`/${locale}/apps/ecommerce/products/add`}>Add Product</MenuItem>
                  )}
                  {can('products.updatePrice') && (
                    <MenuItem href={`/${locale}/apps/ecommerce/products/update-price`}>Update Price</MenuItem>
                  )}
                  {can('products.importProducts') && (
                    <MenuItem href={`/${locale}/apps/ecommerce/products/import-products`}>Import Products</MenuItem>
                  )}
                  {can('products.importOpeningStock') && (
                    <MenuItem href={`/${locale}/apps/ecommerce/products/import-opening-stock`}>Import Opening Stock</MenuItem>
                  )}
                  {can('products.categories') && (
                    <MenuItem href={`/${locale}/apps/ecommerce/products/categories`}>Categories</MenuItem>
                  )}
                  {can('products.brands') && (
                    <MenuItem href={`/${locale}/apps/ecommerce/products/brands`}>Brands</MenuItem>
                  )}
                  {can('products.warranties') && (
                    <MenuItem href={`/${locale}/apps/ecommerce/products/warranties`}>Warranties</MenuItem>
                  )}
                  {can('products.stockAdjustment') && (
                    <MenuItem icon={<i className='tabler-adjustments' />} href={`/${locale}/apps/stock-adjustment`}>
                      {dictionary['navigation'].stockAdjustment || 'Stock Adjustment'}
                    </MenuItem>
                  )}
                </SubMenu>
              )}

              {can('orders.list') && (
                <SubMenu label={dictionary['navigation'].orders}>
                  <MenuItem href={`/${locale}/apps/ecommerce/orders/list`}>
                    Orders {dictionary['navigation'].list}
                  </MenuItem>
                </SubMenu>
              )}

              {can('brands.list') && (
                <SubMenu label={dictionary['navigation'].brands}>
                  <MenuItem href={`/${locale}/apps/ecommerce/brands`}>
                    {dictionary['navigation'].brands} {dictionary['navigation'].list}
                  </MenuItem>
                </SubMenu>
              )}

              {canAny(['promotions.list', 'promotions.create']) && (
                <SubMenu label={dictionary['navigation'].promotions}>
                  {can('promotions.list') && (
                    <MenuItem href={`/${locale}/apps/ecommerce/promotions`}>{dictionary['navigation'].promotions}</MenuItem>
                  )}
                  {can('promotions.create') && (
                    <MenuItem href={`/${locale}/apps/ecommerce/promotions/create`}>{dictionary['navigation'].add}</MenuItem>
                  )}
                </SubMenu>
              )}
            </SubMenu>
          )}

          {showUserManagement && (
            <SubMenu label='User Management' icon={<i className='tabler-users' />}>
              {can('users.list') && <MenuItem href={`/${locale}/apps/user/list`}>{dictionary['navigation'].list}</MenuItem>}
              {can('users.roles') && <MenuItem href={`/${locale}/apps/roles`}>Roles</MenuItem>}
              {can('users.permissions') && <MenuItem href={`/${locale}/apps/permissions`}>Permissions</MenuItem>}
            </SubMenu>
          )}

          {showContacts && (
            <SubMenu label='Contacts' icon={<i className='tabler-address-book' />}>
              {can('contacts.customers') && (
                <MenuItem href={`/${locale}/apps/ecommerce/customers/list`}>Customers</MenuItem>
              )}
              {can('contacts.vendors') && (
                <MenuItem href={`/${locale}/apps/accounting/vendors`}>Vendors</MenuItem>
              )}
            </SubMenu>
          )}

          {showPurchases && (
            <SubMenu label='Purchases' icon={<i className='tabler-shopping-bag' />}>
              {can('purchases.requisition') && (
                <MenuItem href={`/${locale}/apps/purchases/requisition`}>Purchase Requisition</MenuItem>
              )}
              {can('purchases.order') && <MenuItem href={`/${locale}/apps/purchases/order`}>Purchase Order</MenuItem>}
              {can('purchases.list') && <MenuItem href={`/${locale}/apps/purchases/list`}>List Purchases</MenuItem>}
              {can('purchases.add') && <MenuItem href={`/${locale}/apps/purchases/add`}>Add Purchase</MenuItem>}
              {can('purchases.returns') && (
                <MenuItem href={`/${locale}/apps/purchases/returns`}>List Purchase Return</MenuItem>
              )}
            </SubMenu>
          )}

          {showBI && (
            <SubMenu label='Business Intelligence' icon={<i className='tabler-brain' />}>
              {can('bi.dashboard') && <MenuItem href={`/${locale}/apps/bi/dashboard`}>BI Dashboard</MenuItem>}
              {can('bi.insights') && <MenuItem href={`/${locale}/apps/bi/insights`}>AI Insights</MenuItem>}
              {can('bi.analytics') && <MenuItem href={`/${locale}/apps/bi/analytics`}>Analytics</MenuItem>}
            </SubMenu>
          )}

          {showSell && (
            <SubMenu label='Sell' icon={<i className='tabler-cash-register' />}>
              {can('sell.salesOrder') && <MenuItem href={`/${locale}/apps/sell/sales-order`}>Sales Order</MenuItem>}
              {can('sell.allSales') && <MenuItem href={`/${locale}/apps/sell/sales`}>All sales</MenuItem>}
              {can('sell.posList') && <MenuItem href={`/${locale}/apps/sell/pos/list`}>List POS</MenuItem>}
              {can('sell.pos') && <MenuItem href={`/${locale}/apps/sell/pos`}>POS</MenuItem>}
              {can('sell.quotationsAdd') && (
                <MenuItem href={`/${locale}/apps/sell/quotations/add`}>Add Quotation</MenuItem>
              )}
              {can('sell.quotationsList') && (
                <MenuItem href={`/${locale}/apps/sell/quotations`}>List quotations</MenuItem>
              )}
              {can('sell.returns') && <MenuItem href={`/${locale}/apps/sell/returns`}>List Sell Return</MenuItem>}
              {can('sell.shipments') && <MenuItem href={`/${locale}/apps/sell/shipments`}>Shipments</MenuItem>}
              {can('sell.discounts') && <MenuItem href={`/${locale}/apps/sell/discounts`}>Discounts</MenuItem>}
            </SubMenu>
          )}

          {can('expenses') && (
            <MenuItem icon={<i className='tabler-moneybag' />} href={`/${locale}/apps/expenses`}>
              {dictionary['navigation'].expenses || 'Expenses'}
            </MenuItem>
          )}

          {showPaymentAccounts && (
            <SubMenu
              label={dictionary['navigation'].paymentAccounts || 'Payment Accounts'}
              icon={<i className='tabler-credit-card' />}
            >
              {can('paymentAccounts.accounts') && <MenuItem href={`/${locale}/apps/payment-accounts`}>Accounts</MenuItem>}
              {can('paymentAccounts.balanceSheet') && (
                <MenuItem href={`/${locale}/apps/payment-accounts/balance-sheet`}>Balance Sheet</MenuItem>
              )}
              {can('paymentAccounts.trialBalance') && (
                <MenuItem href={`/${locale}/apps/payment-accounts/trial-balance`}>Trial Balance</MenuItem>
              )}
              {can('paymentAccounts.cashFlow') && (
                <MenuItem href={`/${locale}/apps/payment-accounts/cash-flow`}>Cash Flow</MenuItem>
              )}
            </SubMenu>
          )}

          {showAccounting && (
            <SubMenu label='Accounting' icon={<i className='tabler-calculator' />}>
              {can('accounting.dashboard') && <MenuItem href={`/${locale}/apps/accounting/dashboard`}>Dashboard</MenuItem>}
              {can('accounting.chartOfAccounts') && (
                <MenuItem href={`/${locale}/apps/accounting/chart-of-accounts`}>Chart of Accounts</MenuItem>
              )}
              {can('accounting.journalEntries') && (
                <MenuItem href={`/${locale}/apps/accounting/journal-entries`}>Journal Entries</MenuItem>
              )}
              {can('accounting.transactions') && (
                <MenuItem href={`/${locale}/apps/accounting/transactions`}>Transactions</MenuItem>
              )}
              {can('accounting.reports') && <MenuItem href={`/${locale}/apps/accounting/reports`}>Reports</MenuItem>}
              {can('accounting.financialReports') && (
                <MenuItem href={`/${locale}/apps/accounting/financial-reports`}>Financial Reports</MenuItem>
              )}
              {can('accounting.vendors') && <MenuItem href={`/${locale}/apps/accounting/vendors`}>Vendors</MenuItem>}
            </SubMenu>
          )}

          {showReports && (
            <SubMenu label='Reports' icon={<i className='tabler-report-analytics' />}>
              {can('reports.profitLoss') && <MenuItem href={`/${locale}/apps/reports/profit-loss`}>Profit / Loss Report</MenuItem>}
              {can('reports.purchaseSale') && <MenuItem href={`/${locale}/apps/reports/purchase-sale`}>Purchase & Sale</MenuItem>}
              {can('reports.tax') && <MenuItem href={`/${locale}/apps/reports/tax`}>Tax Report</MenuItem>}
              {can('reports.supplierCustomer') && (
                <MenuItem href={`/${locale}/apps/reports/supplier-customer`}>Supplier & Customer Report</MenuItem>
              )}
              {can('reports.customerGroups') && (
                <MenuItem href={`/${locale}/apps/reports/customer-groups`}>Customer Groups Report</MenuItem>
              )}
              {can('reports.stock') && <MenuItem href={`/${locale}/apps/reports/stock`}>Stock Report</MenuItem>}
              {can('reports.stockExpiry') && (
                <MenuItem href={`/${locale}/apps/reports/stock-expiry`}>Stock Expiry Report</MenuItem>
              )}
              {can('reports.lot') && <MenuItem href={`/${locale}/apps/reports/lot`}>Lot Report</MenuItem>}
              {can('reports.stockAdjustment') && (
                <MenuItem href={`/${locale}/apps/reports/stock-adjustment`}>Stock Adjustment Report</MenuItem>
              )}
              {can('reports.trendingProducts') && (
                <MenuItem href={`/${locale}/apps/reports/trending-products`}>Trending Products</MenuItem>
              )}
              {can('reports.items') && <MenuItem href={`/${locale}/apps/reports/items`}>Items Report</MenuItem>}
              {can('reports.productPurchase') && (
                <MenuItem href={`/${locale}/apps/reports/product-purchase`}>Product Purchase Report</MenuItem>
              )}
              {can('reports.productSell') && (
                <MenuItem href={`/${locale}/apps/reports/product-sell`}>Product Sell Report</MenuItem>
              )}
              {can('reports.purchasePayment') && (
                <MenuItem href={`/${locale}/apps/reports/purchase-payment`}>Purchase Payment Report</MenuItem>
              )}
              {can('reports.sellPayment') && (
                <MenuItem href={`/${locale}/apps/reports/sell-payment`}>Sell Payment Report</MenuItem>
              )}
              {can('reports.expense') && <MenuItem href={`/${locale}/apps/reports/expense`}>Expense Report</MenuItem>}
              {can('reports.register') && <MenuItem href={`/${locale}/apps/reports/register`}>Register Report</MenuItem>}
              {can('reports.salesRepresentative') && (
                <MenuItem href={`/${locale}/apps/reports/sales-representative`}>Sales Representative Report</MenuItem>
              )}
              {can('reports.activityLog') && (
                <MenuItem href={`/${locale}/apps/reports/activity-log`}>Activity Log</MenuItem>
              )}
            </SubMenu>
          )}

          {can('settings') && (
            <MenuItem icon={<i className='tabler-settings' />} href={`/${locale}/pages/account-settings`}>
              Settings
            </MenuItem>
          )}
          {can('woocommerce') && (
            <MenuItem
              icon={<i className='tabler-brand-woocommerce' />}
              href={`${process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL || '#'}`}
              target='_blank'
            >
              WooCommerce
            </MenuItem>
          )}

        </MenuSection>
      </Menu>
      {/* <Menu
          popoutMenuOffset={{ mainAxis: 23 }}
          menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
          renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
          renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
          menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
        >
          <GenerateVerticalMenu menuData={menuData(dictionary)} />
        </Menu> */}
    </ScrollWrapper>
  )
}

export default VerticalMenu
