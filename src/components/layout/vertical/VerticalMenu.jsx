// Next Imports
import { useParams } from 'next/navigation'

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

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const { lang: locale } = params
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

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
          <MenuItem icon={<i className='tabler-home' />} href={`/${locale}/apps/ecommerce/dashboard`}>Home</MenuItem>
          <SubMenu label={dictionary['navigation'].products} icon={<i className='tabler-shopping-cart' />} >
            <MenuItem href={`/${locale}/apps/ecommerce/dashboard`}>{dictionary['navigation'].dashboard}</MenuItem>

            <SubMenu label='Products'>
              <MenuItem href={`/${locale}/apps/ecommerce/products/list`}>List Products</MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/products/add`}>Add Product</MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/products/update-price`}>Update Price</MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/products/import-products`}>Import Products</MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/products/import-opening-stock`}>Import Opening Stock</MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/products/categories`}>Categories</MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/products/brands`}>Brands</MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/products/warranties`}>Warranties</MenuItem>
              <MenuItem icon={<i className='tabler-adjustments' />} href={`/${locale}/apps/stock-adjustment`}>{dictionary['navigation'].stockAdjustment || 'Stock Adjustment'}</MenuItem>
            </SubMenu>
            <SubMenu label={dictionary['navigation'].orders}>
              <MenuItem href={`/${locale}/apps/ecommerce/orders/list`}>Orders {dictionary['navigation'].list}</MenuItem>
            </SubMenu>


            <SubMenu label={dictionary['navigation'].brands}>
              <MenuItem href={`/${locale}/apps/ecommerce/brands`}>{dictionary['navigation'].brands} {dictionary['navigation'].list}</MenuItem>
            </SubMenu>
            <SubMenu label={dictionary['navigation'].promotions}>
              <MenuItem href={`/${locale}/apps/ecommerce/promotions`}>{dictionary['navigation'].promotions}</MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/promotions/create`}>{dictionary['navigation'].add}</MenuItem>
            </SubMenu>
          </SubMenu>
          <SubMenu label='User Management' icon={<i className='tabler-users' />}>
            <MenuItem href={`/${locale}/apps/user/list`}>{dictionary['navigation'].list}</MenuItem>
            <MenuItem href={`/${locale}/apps/roles`}>Roles</MenuItem>
            <MenuItem href={`/${locale}/apps/permissions`}>Permissions</MenuItem>
          </SubMenu>
          <SubMenu label='Contacts' icon={<i className='tabler-address-book' />}>
            <MenuItem href={`/${locale}/apps/ecommerce/customers/list`}>Customers</MenuItem>
            <MenuItem href={`/${locale}/apps/accounting/vendors`}>Vendors</MenuItem>
          </SubMenu>
          <SubMenu label='Purchases' icon={<i className='tabler-shopping-bag' />}>
            <MenuItem href={`/${locale}/apps/purchases/requisition`}>Purchase Requisition</MenuItem>
            <MenuItem href={`/${locale}/apps/purchases/order`}>Purchase Order</MenuItem>
            <MenuItem href={`/${locale}/apps/purchases/list`}>List Purchases</MenuItem>
            <MenuItem href={`/${locale}/apps/purchases/add`}>Add Purchase</MenuItem>
            <MenuItem href={`/${locale}/apps/purchases/returns`}>List Purchase Return</MenuItem>

          </SubMenu>
          <SubMenu label='Business Intelligence' icon={<i className='tabler-brain' />}>
            <MenuItem href={`/${locale}/apps/bi/dashboard`}>BI Dashboard</MenuItem>
            <MenuItem href={`/${locale}/apps/bi/insights`}>AI Insights</MenuItem>
            <MenuItem href={`/${locale}/apps/bi/analytics`}>Analytics</MenuItem>
          </SubMenu>
          <SubMenu label='Sell' icon={<i className='tabler-cash-register' />}>
            <MenuItem href={`/${locale}/apps/sell/sales-order`}>Sales Order</MenuItem>
            <MenuItem href={`/${locale}/apps/sell/sales`}>All sales</MenuItem>
            <MenuItem href={`/${locale}/apps/sell/pos/list`}>List POS</MenuItem>
            <MenuItem href={`/${locale}/apps/sell/pos`}>POS</MenuItem>

            <MenuItem href={`/${locale}/apps/sell/quotations/add`}>Add Quotation</MenuItem>
            <MenuItem href={`/${locale}/apps/sell/quotations`}>List quotations</MenuItem>
            <MenuItem href={`/${locale}/apps/sell/returns`}>List Sell Return</MenuItem>
            <MenuItem href={`/${locale}/apps/sell/shipments`}>Shipments</MenuItem>
            <MenuItem href={`/${locale}/apps/sell/discounts`}>Discounts</MenuItem>
          </SubMenu>


          <MenuItem icon={<i className='tabler-moneybag' />} href={`/${locale}/apps/expenses`}>
            {dictionary['navigation'].expenses || 'Expenses'}
          </MenuItem>
          <SubMenu label={dictionary['navigation'].paymentAccounts || 'Payment Accounts'} icon={<i className='tabler-credit-card' />}>
            <MenuItem href={`/${locale}/apps/payment-accounts`}>Accounts</MenuItem>
            <MenuItem href={`/${locale}/apps/payment-accounts/balance-sheet`}>Balance Sheet</MenuItem>
            <MenuItem href={`/${locale}/apps/payment-accounts/trial-balance`}>Trial Balance</MenuItem>
            <MenuItem href={`/${locale}/apps/payment-accounts/cash-flow`}>Cash Flow</MenuItem>
          </SubMenu>
          <SubMenu label='Accounting' icon={<i className='tabler-calculator' />}>
            <MenuItem href={`/${locale}/apps/accounting/dashboard`}>Dashboard</MenuItem>
            <MenuItem href={`/${locale}/apps/accounting/chart-of-accounts`}>Chart of Accounts</MenuItem>
            <MenuItem href={`/${locale}/apps/accounting/journal-entries`}>Journal Entries</MenuItem>
            <MenuItem href={`/${locale}/apps/accounting/transactions`}>Transactions</MenuItem>
            <MenuItem href={`/${locale}/apps/accounting/reports`}>Reports</MenuItem>
            <MenuItem href={`/${locale}/apps/accounting/financial-reports`}>Financial Reports</MenuItem>
            <MenuItem href={`/${locale}/apps/accounting/vendors`}>Vendors</MenuItem>
          </SubMenu>
          <SubMenu label='Reports' icon={<i className='tabler-report-analytics' />}>
            <MenuItem href={`/${locale}/apps/reports/profit-loss`}>Profit / Loss Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/purchase-sale`}>Purchase & Sale</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/tax`}>Tax Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/supplier-customer`}>Supplier & Customer Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/customer-groups`}>Customer Groups Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/stock`}>Stock Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/stock-expiry`}>Stock Expiry Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/lot`}>Lot Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/stock-adjustment`}>Stock Adjustment Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/trending-products`}>Trending Products</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/items`}>Items Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/product-purchase`}>Product Purchase Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/product-sell`}>Product Sell Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/purchase-payment`}>Purchase Payment Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/sell-payment`}>Sell Payment Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/expense`}>Expense Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/register`}>Register Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/sales-representative`}>Sales Representative Report</MenuItem>
            <MenuItem href={`/${locale}/apps/reports/activity-log`}>Activity Log</MenuItem>
          </SubMenu>
          <MenuItem icon={<i className='tabler-settings' />} href={`/${locale}/pages/account-settings`}>Settings</MenuItem>
          <MenuItem icon={<i className='tabler-brand-woocommerce' />} href={`${process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL || '#'}`} target='_blank'>WooCommerce</MenuItem>

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
