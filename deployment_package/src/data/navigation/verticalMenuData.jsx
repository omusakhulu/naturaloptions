const verticalMenuData = dictionary => [
  // This is how you will normally render submenu
  {
    label: dictionary['navigation'].dashboards,
    suffix: {
      label: '5',
      color: 'error'
    },
    icon: 'tabler-smart-home',
    children: [
      // This is how you will normally render menu item
      {
        label: dictionary['navigation'].crm,
        icon: 'tabler-circle',
        href: '/dashboards/crm'
      },
      {
        label: dictionary['navigation'].analytics,
        icon: 'tabler-circle',
        href: '/dashboards/analytics'
      },
      {
        label: dictionary['navigation'].eCommerce,
        icon: 'tabler-circle',
        href: '/dashboards/ecommerce'
      },
      
    ]
  },
  {
    label: dictionary['navigation'].frontPages,
    icon: 'tabler-files',
    children: [
      {
        label: dictionary['navigation'].landing,
        href: '/front-pages/landing-page',
        target: '_blank',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].pricing,
        href: '/front-pages/pricing',
        target: '_blank',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].payment,
        href: '/front-pages/payment',
        target: '_blank',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].checkout,
        href: '/front-pages/checkout',
        target: '_blank',
        excludeLang: true
      },
      {
        label: dictionary['navigation'].helpCenter,
        href: '/front-pages/help-center',
        target: '_blank',
        excludeLang: true
      }
    ]
  },

  // This is how you will normally render menu section
  {
    label: dictionary['navigation'].appsPages,
    isSection: true,
    children: [
      {
        label: dictionary['navigation'].eCommerce,
        icon: 'tabler-shopping-cart',
        children: [
          {
            label: dictionary['navigation'].dashboard,
            href: '/apps/ecommerce/dashboard'
          },
          {
            label: dictionary['navigation'].products,
            children: [
              {
                label: dictionary['navigation'].list,
                href: '/apps/ecommerce/products/list'
              },
              {
                label: dictionary['navigation'].add,
                href: '/apps/ecommerce/products/add'
              },
              {
                label: dictionary['navigation'].category,
                href: '/apps/ecommerce/products/category'
              },
              {
                label: 'Attributes',
                href: '/apps/ecommerce/products/attributes'
              }
            ]
          },
          {
            label: dictionary['navigation'].orders,
            children: [
              {
                label: dictionary['navigation'].list,
                href: '/apps/ecommerce/orders/list'
              },
              {
                label: dictionary['navigation'].details,
                href: '/apps/ecommerce/orders/details/5434',
                exactMatch: false,
                activeUrl: '/apps/ecommerce/orders/details'
              }
            ]
          },
          {
            label: dictionary['navigation'].customers,
            children: [
              {
                label: dictionary['navigation'].list,
                href: '/apps/ecommerce/customers/list'
              },
              {
                label: dictionary['navigation'].details,
                href: '/apps/ecommerce/customers/details/879861',
                exactMatch: false,
                activeUrl: '/apps/ecommerce/customers/details'
              }
            ]
          }
        ]
      },
      {
        label: dictionary['navigation'].email,
        icon: 'tabler-mail',
        href: '/apps/email',
        exactMatch: false,
        activeUrl: '/apps/email'
      },
      {
        label: dictionary['navigation'].chat,
        icon: 'tabler-message-circle-2',
        href: '/apps/chat'
      },
      {
        label: 'Shopper Assistant',
        icon: 'tabler-robot',
        href: '/apps/shopper-assistant'
      },
      {
        label: dictionary['navigation'].calendar,
        icon: 'tabler-calendar',
        href: '/apps/calendar'
      },
      {
        label: dictionary['navigation'].kanban,
        icon: 'tabler-copy',
        href: '/apps/kanban'
      },
      {
        label: dictionary['navigation'].user,
        icon: 'tabler-user',
        children: [
          {
            label: dictionary['navigation'].list,
            icon: 'tabler-circle',
            href: '/apps/user/list'
          },
          {
            label: dictionary['navigation'].view,
            icon: 'tabler-circle',
            href: '/apps/user/view'
          }
        ]
      },
      {
        label: dictionary['navigation'].rolesPermissions,
        icon: 'tabler-lock',
        children: [
          {
            label: dictionary['navigation'].roles,
            icon: 'tabler-circle',
            href: '/apps/roles'
          },
          {
            label: dictionary['navigation'].permissions,
            icon: 'tabler-circle',
            href: '/apps/permissions'
          }
        ]
      },
    ]
  },
  
  // POS System Section
  {
    label: 'Point of Sale',
    icon: 'tabler-cash-register',
    children: [
      {
        label: 'POS Terminal',
        icon: 'tabler-device-tablet',
        href: '/apps/pos/terminal'
      },
      {
        label: 'Employee Management',
        icon: 'tabler-users',
        href: '/apps/pos/employees'
      },
      {
        label: 'Sales Reports',
        icon: 'tabler-chart-bar',
        href: '/apps/pos/sales-reports'
      },
      {
        label: 'Locations',
        icon: 'tabler-map-pin',
        href: '/apps/pos/locations'
      }
    ]
  },
  // Accounting System Section
  {
    label: 'Accounting',
    icon: 'tabler-calculator',
    children: [
      {
        label: 'Dashboard',
        icon: 'tabler-dashboard',
        href: '/apps/accounting/dashboard'
      },
      {
        label: 'Chart of Accounts',
        icon: 'tabler-list-tree',
        href: '/apps/accounting/chart-of-accounts'
      },
      {
        label: 'Financial Reports',
        icon: 'tabler-report-analytics',
        href: '/apps/accounting/financial-reports'
      },
      {
        label: 'Journal Entries',
        icon: 'tabler-book',
        href: '/apps/accounting/journal-entries'
      },
      {
        label: 'Accounts Receivable',
        icon: 'tabler-receipt',
        href: '/apps/accounting/accounts-receivable'
      },
      {
        label: 'Accounts Payable',
        icon: 'tabler-credit-card',
        href: '/apps/accounting/accounts-payable'
      },
      {
        label: 'Vendors',
        icon: 'tabler-building-store',
        href: '/apps/accounting/vendors'
      }
    ]
  }
]

export default verticalMenuData
