"use client"

import React from 'react'
import PurchaseSaleReport from '@/components/reports/PurchaseSaleReportTSX'
import TaxReport from '@/components/reports/TaxReportTSX'
import StockReport from '@/components/reports/StockReportTSX'
import ItemsReport from '@/components/reports/ItemsReportTSX'
import ProfitLossReport from '@/components/reports/ProfitLossReport'
import SupplierReport from '@/components/reports/SupplierReportTSX'
import CustomerReport from '@/components/reports/CustomerReportTSX'
import SupplierCustomerReport from '@/components/reports/SupplierCustomerReportTSX'
import CustomerGroupsReport from '@/components/reports/CustomerGroupsReportTSX'
import StockExpiryReport from '@/components/reports/StockExpiryReportTSX'
import LotReport from '@/components/reports/LotReportTSX'
import StockAdjustmentReport from '@/components/reports/StockAdjustmentReportTSX'
import TrendingProductsReport from '@/components/reports/TrendingProductsReportTSX'
import ProductPurchaseReport from '@/components/reports/ProductPurchaseReportTSX'
import ProductSellReport from '@/components/reports/ProductSellReportTSX'
import PurchasePaymentReport from '@/components/reports/PurchasePaymentReportTSX'
import SellPaymentReport from '@/components/reports/SellPaymentReportTSX'
import ExpenseReport from '@/components/reports/ExpenseReportTSX'
import RegisterReport from '@/components/reports/RegisterReportTSX'
import ActivityLogReport from '@/components/reports/ActivityLogReportTSX'
import SalesRepresentativeReport from '@/components/reports/SalesRepresentativeReportTSX'

const TITLES = {
  'profit-loss': 'Profit / Loss Report',
  'purchase-sale': 'Purchase & Sale',
  'tax': 'Tax Report',
  'supplier-customer': 'Supplier & Customer Report',
  'supplier': 'Supplier Report',
  'customers': 'Customer Report',
  'customer-groups': 'Customer Groups Report',
  'stock': 'Stock Report',
  'stock-expiry': 'Stock Expiry Report',
  'lot': 'Lot Report',
  'stock-adjustment': 'Stock Adjustment Report',
  'trending-products': 'Trending Products',
  'items': 'Items Report',
  'product-purchase': 'Product Purchase Report',
  'product-sell': 'Product Sell Report',
  'purchase-payment': 'Purchase Payment Report',
  'sell-payment': 'Sell Payment Report',
  'expense': 'Expense Report',
  'register': 'Register Report',
  'sales-representative': 'Sales Representative Report',
  'activity-log': 'Activity Log'
}

export default function ReportPage({ params }) {
  const p = React.use(params)
  const slug = p?.slug
  const lang = p?.lang || 'en'
  const title = TITLES[slug] || 'Report'

  if (slug === 'profit-loss') {
    return <ProfitLossReport lang={lang} />
  }
  if (slug === 'purchase-sale') {
    return <PurchaseSaleReport lang={lang} />
  }
  if (slug === 'tax') {
    return <TaxReport lang={lang} />
  }
  if (slug === 'stock') {
    return <StockReport lang={lang} />
  }
  if (slug === 'items') {
    return <ItemsReport lang={lang} />
  }
  if (slug === 'supplier') {
    return <SupplierReport lang={lang} />
  }
  if (slug === 'customers') {
    return <CustomerReport lang={lang} />
  }
  if (slug === 'supplier-customer') {
    return <SupplierCustomerReport lang={lang} />
  }
  if (slug === 'customer-groups') {
    return <CustomerGroupsReport lang={lang} />
  }
  if (slug === 'stock-expiry') {
    return <StockExpiryReport lang={lang} />
  }
  if (slug === 'lot') {
    return <LotReport lang={lang} />
  }
  if (slug === 'stock-adjustment') {
    return <StockAdjustmentReport lang={lang} />
  }
  if (slug === 'trending-products') {
    return <TrendingProductsReport lang={lang} />
  }
  if (slug === 'product-purchase') {
    return <ProductPurchaseReport lang={lang} />
  }
  if (slug === 'product-sell') {
    return <ProductSellReport lang={lang} />
  }
  if (slug === 'purchase-payment') {
    return <PurchasePaymentReport lang={lang} />
  }
  if (slug === 'sell-payment') {
    return <SellPaymentReport lang={lang} />
  }
  if (slug === 'expense') {
    return <ExpenseReport lang={lang} />
  }
  if (slug === 'register') {
    return <RegisterReport lang={lang} />
  }
  if (slug === 'activity-log') {
    return <ActivityLogReport lang={lang} />
  }
  if (slug === 'sales-representative') {
    return <SalesRepresentativeReport lang={lang} />
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="bg-white border rounded shadow p-4 space-y-4">
        <div className="text-sm text-gray-600">Filters</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Date From" type="date" />
          <input className="border rounded px-3 py-2" placeholder="Date To" type="date" />
          <input className="border rounded px-3 py-2" placeholder="Search" />
        </div>
      </div>
      <div className="bg-white border rounded shadow p-4">
        <div className="text-sm text-gray-600 mb-2">Data</div>
        <div className="text-gray-500 text-sm">Report content will appear here.</div>
      </div>
    </div>
  )
}
