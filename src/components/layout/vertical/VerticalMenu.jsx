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
        <MenuSection label='Omnishop'>
          <SubMenu label={dictionary['navigation'].eCommerce} icon={<i className='tabler-shopping-cart' />} defaultOpen>
            <MenuItem href={`/${locale}/apps/ecommerce/dashboard`}>{dictionary['navigation'].dashboard}</MenuItem>

            <SubMenu label={dictionary['navigation'].products}>
              <MenuItem href={`/${locale}/apps/ecommerce/products/list`}>
                All Products {dictionary['navigation'].list}
              </MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/products/add`}>{dictionary['navigation'].add}</MenuItem>

              <MenuItem href={`/${locale}/apps/ecommerce/products/category`}>
                {dictionary['navigation'].category}
              </MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/products/attributes`}>Attributes</MenuItem>
            </SubMenu>
            <SubMenu label={dictionary['navigation'].orders}>
              <MenuItem href={`/${locale}/apps/ecommerce/orders/list`}>Orders {dictionary['navigation'].list}</MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/orders/stands`}>Stands</MenuItem>
            </SubMenu>
            <SubMenu label={dictionary['navigation'].customers}>
              <MenuItem href={`/${locale}/apps/ecommerce/customers/list`}>
                Customers {dictionary['navigation'].list}
              </MenuItem>
            </SubMenu>
          </SubMenu>

          <SubMenu
            label={dictionary['navigation'].invoicing}
            icon={<i className='tabler-file-description' />}
            defaultOpen
          >
            <MenuItem href={`/${locale}/apps/invoice/list`}>{dictionary['navigation'].list}</MenuItem>

            <MenuItem href={`/${locale}/apps/invoice/add`}>{dictionary['navigation'].add}</MenuItem>
          </SubMenu>
          <SubMenu label={dictionary['navigation'].user} icon={<i className='tabler-user' />}>
            <MenuItem href={`/${locale}/apps/user/list`}>{dictionary['navigation'].list}</MenuItem>
            <MenuItem href={`/${locale}/apps/roles`}>Roles</MenuItem>
            <MenuItem href={`/${locale}/apps/permissions`}>Permissions</MenuItem>
          </SubMenu>
          <SubMenu label={dictionary['navigation'].packingSlips} icon={<i className='tabler-file-invoice' />}>
            <MenuItem href={`/${locale}/apps/packing-slips/list`}>{dictionary['navigation'].list}</MenuItem>
          </SubMenu>
          <SubMenu label='Projects' icon={<i className='tabler-briefcase' />}>
            <MenuItem href={`/${locale}/apps/projects/list`}>{dictionary['navigation'].list}</MenuItem>
            <MenuItem href={`/${locale}/apps/projects/create`}>Create Quote</MenuItem>
            <MenuItem href={`/${locale}/apps/projects/boq/list`}>BOQ (Bills)</MenuItem>
            <MenuItem href={`/${locale}/apps/projects/cost-reports/list`}>Cost Reports</MenuItem>
          </SubMenu>
          <MenuItem href={`/${locale}/apps/projects/cost-reports/list`} icon={<i className='tabler-report-money' />}>
            Cost Reports
          </MenuItem>
          <SubMenu label='Quotes' icon={<i className='tabler-receipt' />} defaultOpen>
            <MenuItem href={`/${locale}/apps/quotes/event-tent`}>New Event Tent Quote</MenuItem>
            <MenuItem href={`/${locale}/apps/quotes/event-tent/list`}>Saved Quotes</MenuItem>
          </SubMenu>
          <SubMenu label='BOQ' icon={<i className='tabler-table' />} defaultOpen>
            <MenuItem href={`/${locale}/apps/boq/list`}>View All BOQs</MenuItem>
          </SubMenu>
          <SubMenu label='Warehousing' icon={<i className='tabler-building-warehouse' />} defaultOpen>
            <MenuItem href={`/${locale}/apps/warehouses/list`}>All Warehouses</MenuItem>
            <MenuItem href={`/${locale}/apps/warehouses/add`}>Add Warehouse</MenuItem>
          </SubMenu>
          <SubMenu label='Logistics' icon={<i className='tabler-truck-delivery' />}>
            <MenuItem href={`/${locale}/apps/logistics/dashboard`}>Dashboard</MenuItem>
            <MenuItem href={`/${locale}/apps/logistics/fleet`}>Fleet</MenuItem>
            <MenuItem href={`/${locale}/apps/logistics/assignments`}>Assignments</MenuItem>
          </SubMenu>
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
