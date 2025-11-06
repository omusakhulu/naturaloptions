import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Fallback defaults provided by user; used to seed ChartOfAccounts if empty
const DEFAULT_OPTIONS: { id: number; text: string; html: string }[] = [
  {"id":3,"text":"Accounts Payable (A\/P) - <small class=\"text-muted\">Liability - Accounts Payable (A\/P)<\/small>","html":"Accounts Payable (A\/P) - <small class=\"text-muted\">Liability - Accounts Payable (A\/P)<\/small>"},
  {"id":4,"text":"Credit Card - <small class=\"text-muted\">Liability - Credit Card<\/small>","html":"Credit Card - <small class=\"text-muted\">Liability - Credit Card<\/small>"},
  {"id":5,"text":"Wage expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Wage expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":6,"text":"Utilities - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Utilities - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":7,"text":"Unrealised loss on securities, net of tax - <small class=\"text-muted\">Income - Other income<\/small>","html":"Unrealised loss on securities, net of tax - <small class=\"text-muted\">Income - Other income<\/small>"},
  {"id":8,"text":"Undeposited Funds - <small class=\"text-muted\">Asset - Current assets<\/small>","html":"Undeposited Funds - <small class=\"text-muted\">Asset - Current assets<\/small>"},
  {"id":9,"text":"Uncategorised Income - <small class=\"text-muted\">Income - Income<\/small>","html":"Uncategorised Income - <small class=\"text-muted\">Income - Income<\/small>"},
  {"id":10,"text":"Uncategorised Expense - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Uncategorised Expense - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":11,"text":"Uncategorised Asset - <small class=\"text-muted\">Asset - Current assets<\/small>","html":"Uncategorised Asset - <small class=\"text-muted\">Asset - Current assets<\/small>"},
  {"id":12,"text":"Unapplied Cash Payment Income - <small class=\"text-muted\">Income - Income<\/small>","html":"Unapplied Cash Payment Income - <small class=\"text-muted\">Income - Income<\/small>"},
  {"id":13,"text":"Travel expenses - selling expense - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Travel expenses - selling expense - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":14,"text":"Supplies - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Supplies - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":15,"text":"Subcontractors - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>","html":"Subcontractors - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>"},
  {"id":16,"text":"Stationery and printing - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Stationery and printing - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":17,"text":"Short-term debit - <small class=\"text-muted\">Liability - Current liabilities<\/small>","html":"Short-term debit - <small class=\"text-muted\">Liability - Current liabilities<\/small>"},
  {"id":18,"text":"Shipping and delivery expense - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Shipping and delivery expense - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":19,"text":"Share capital - <small class=\"text-muted\">Equity - Owner's Equity<\/small>","html":"Share capital - <small class=\"text-muted\">Equity - Owner's Equity<\/small>"},
  {"id":20,"text":"Sales of Product Income - <small class=\"text-muted\">Income - Income<\/small>","html":"Sales of Product Income - <small class=\"text-muted\">Income - Income<\/small>"},
  {"id":21,"text":"Sales - wholesale - <small class=\"text-muted\">Income - Income<\/small>","html":"Sales - wholesale - <small class=\"text-muted\">Income - Income<\/small>"},
  {"id":22,"text":"Sales - retail - <small class=\"text-muted\">Income - Income<\/small>","html":"Sales - retail - <small class=\"text-muted\">Income - Income<\/small>"},
  {"id":23,"text":"Sales - <small class=\"text-muted\">Income - Income<\/small>","html":"Sales - <small class=\"text-muted\">Income - Income<\/small>"},
  {"id":24,"text":"Revenue - General - <small class=\"text-muted\">Income - Income<\/small>","html":"Revenue - General - <small class=\"text-muted\">Income - Income<\/small>"},
  {"id":25,"text":"Retained Earnings - <small class=\"text-muted\">Equity - Owner's Equity<\/small>","html":"Retained Earnings - <small class=\"text-muted\">Equity - Owner's Equity<\/small>"},
  {"id":26,"text":"Repair and maintenance - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Repair and maintenance - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":27,"text":"Rent or lease payments - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Rent or lease payments - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":28,"text":"Reconciliation Discrepancies - <small class=\"text-muted\">Expenses - Other Expense<\/small>","html":"Reconciliation Discrepancies - <small class=\"text-muted\">Expenses - Other Expense<\/small>"},
  {"id":29,"text":"Purchases - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Purchases - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":30,"text":"Property, plant and equipment - <small class=\"text-muted\">Asset - Fixed assets<\/small>","html":"Property, plant and equipment - <small class=\"text-muted\">Asset - Fixed assets<\/small>"},
  {"id":31,"text":"Prepaid Expenses - <small class=\"text-muted\">Asset - Current assets<\/small>","html":"Prepaid Expenses - <small class=\"text-muted\">Asset - Current assets<\/small>"},
  {"id":32,"text":"Payroll liabilities - <small class=\"text-muted\">Liability - Current liabilities<\/small>","html":"Payroll liabilities - <small class=\"text-muted\">Liability - Current liabilities<\/small>"},
  {"id":33,"text":"Payroll Expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Payroll Expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":34,"text":"Payroll Clearing - <small class=\"text-muted\">Liability - Current liabilities<\/small>","html":"Payroll Clearing - <small class=\"text-muted\">Liability - Current liabilities<\/small>"},
  {"id":35,"text":"Overhead - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>","html":"Overhead - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>"},
  {"id":36,"text":"Other Types of Expenses-Advertising Expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Other Types of Expenses-Advertising Expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":37,"text":"Other selling expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Other selling expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":38,"text":"Other operating income (expenses) - <small class=\"text-muted\">Income - Other income<\/small>","html":"Other operating income (expenses) - <small class=\"text-muted\">Income - Other income<\/small>"},
  {"id":39,"text":"Other general and administrative expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Other general and administrative expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":40,"text":"Other comprehensive income - <small class=\"text-muted\">Equity - Owner's Equity<\/small>","html":"Other comprehensive income - <small class=\"text-muted\">Equity - Owner's Equity<\/small>"},
  {"id":41,"text":"Other - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>","html":"Other - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>"},
  {"id":42,"text":"Office expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Office expenses - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":43,"text":"Meals and entertainment - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Meals and entertainment - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":44,"text":"Materials - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>","html":"Materials - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>"},
  {"id":45,"text":"Management compensation - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Management compensation - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":46,"text":"Loss on disposal of assets - <small class=\"text-muted\">Income - Other income<\/small>","html":"Loss on disposal of assets - <small class=\"text-muted\">Income - Other income<\/small>"},
  {"id":47,"text":"Loss on discontinued operations, net of tax - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Loss on discontinued operations, net of tax - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":48,"text":"Long-term investments - <small class=\"text-muted\">Asset - Non-current assets<\/small>","html":"Long-term investments - <small class=\"text-muted\">Asset - Non-current assets<\/small>"},
  {"id":49,"text":"Long-term debt - <small class=\"text-muted\">Liability - Non-current liabilities<\/small>","html":"Long-term debt - <small class=\"text-muted\">Liability - Non-current liabilities<\/small>"},
  {"id":50,"text":"Liabilities related to assets held for sale - <small class=\"text-muted\">Liability - Non-current liabilities<\/small>","html":"Liabilities related to assets held for sale - <small class=\"text-muted\">Liability - Non-current liabilities<\/small>"},
  {"id":51,"text":"Legal and professional fees - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Legal and professional fees - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":52,"text":"Inventory Asset - <small class=\"text-muted\">Asset - Current assets<\/small>","html":"Inventory Asset - <small class=\"text-muted\">Asset - Current assets<\/small>"},
  {"id":53,"text":"Inventory - <small class=\"text-muted\">Asset - Current assets<\/small>","html":"Inventory - <small class=\"text-muted\">Asset - Current assets<\/small>"},
  {"id":54,"text":"Interest income - <small class=\"text-muted\">Income - Other income<\/small>","html":"Interest income - <small class=\"text-muted\">Income - Other income<\/small>"},
  {"id":55,"text":"Interest expense - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Interest expense - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":56,"text":"Intangibles - <small class=\"text-muted\">Asset - Non-current assets<\/small>","html":"Intangibles - <small class=\"text-muted\">Asset - Non-current assets<\/small>"},
  {"id":57,"text":"Insurance - Liability - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Insurance - Liability - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":58,"text":"Insurance - General - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Insurance - General - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":59,"text":"Insurance - Disability - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Insurance - Disability - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":60,"text":"Income tax payable - <small class=\"text-muted\">Liability - Current liabilities<\/small>","html":"Income tax payable - <small class=\"text-muted\">Liability - Current liabilities<\/small>"},
  {"id":61,"text":"Income tax expense - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Income tax expense - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":62,"text":"Goodwill - <small class=\"text-muted\">Asset - Non-current assets<\/small>","html":"Goodwill - <small class=\"text-muted\">Asset - Non-current assets<\/small>"},
  {"id":63,"text":"Freight and delivery - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>","html":"Freight and delivery - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>"},
  {"id":64,"text":"Equity in earnings of subsidiaries - <small class=\"text-muted\">Equity - Owner's Equity<\/small>","html":"Equity in earnings of subsidiaries - <small class=\"text-muted\">Equity - Owner's Equity<\/small>"},
  {"id":65,"text":"Equipment rental - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Equipment rental - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":66,"text":"Dues and Subscriptions - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Dues and Subscriptions - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":67,"text":"Dividends payable - <small class=\"text-muted\">Liability - Current liabilities<\/small>","html":"Dividends payable - <small class=\"text-muted\">Liability - Current liabilities<\/small>"},
  {"id":68,"text":"Dividend income - <small class=\"text-muted\">Income - Other income<\/small>","html":"Dividend income - <small class=\"text-muted\">Income - Other income<\/small>"},
  {"id":69,"text":"Dividend disbursed - <small class=\"text-muted\">Equity - Owner's Equity<\/small>","html":"Dividend disbursed - <small class=\"text-muted\">Equity - Owner's Equity<\/small>"},
  {"id":70,"text":"Discounts given - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>","html":"Discounts given - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>"},
  {"id":71,"text":"Direct labour - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>","html":"Direct labour - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>"},
  {"id":72,"text":"Deferred tax assets - <small class=\"text-muted\">Asset - Non-current assets<\/small>","html":"Deferred tax assets - <small class=\"text-muted\">Asset - Non-current assets<\/small>"},
  {"id":73,"text":"Cost of sales - <small class=\"text-muted\">Expenses - Cost of sales<\/small>","html":"Cost of sales - <small class=\"text-muted\">Expenses - Cost of sales<\/small>"},
  {"id":74,"text":"Commissions and fees - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Commissions and fees - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":75,"text":"Change in inventory - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>","html":"Change in inventory - COS - <small class=\"text-muted\">Expenses - Cost of sales<\/small>"},
  {"id":76,"text":"Cash and cash equivalents - <small class=\"text-muted\">Asset - Cash and cash equivalents<\/small>","html":"Cash and cash equivalents - <small class=\"text-muted\">Asset - Cash and cash equivalents<\/small>"},
  {"id":77,"text":"Billable Expense Income - <small class=\"text-muted\">Income - Income<\/small>","html":"Billable Expense Income - <small class=\"text-muted\">Income - Income<\/small>"},
  {"id":78,"text":"Bank charges - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Bank charges - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":79,"text":"Bad debts - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Bad debts - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":80,"text":"Available for sale assets (short-term) - <small class=\"text-muted\">Asset - Current assets<\/small>","html":"Available for sale assets (short-term) - <small class=\"text-muted\">Asset - Current assets<\/small>"},
  {"id":81,"text":"Assets held for sale - <small class=\"text-muted\">Asset - Non-current assets<\/small>","html":"Assets held for sale - <small class=\"text-muted\">Asset - Non-current assets<\/small>"},
  {"id":82,"text":"Amortisation expense - <small class=\"text-muted\">Expenses - Expenses<\/small>","html":"Amortisation expense - <small class=\"text-muted\">Expenses - Expenses<\/small>"},
  {"id":83,"text":"Allowance for bad debts - <small class=\"text-muted\">Asset - Current assets<\/small>","html":"Allowance for bad debts - <small class=\"text-muted\">Asset - Current assets<\/small>"},
  {"id":84,"text":"Accumulated depreciation on property, plant and equipment - <small class=\"text-muted\">Asset - Fixed assets<\/small>","html":"Accumulated depreciation on property, plant and equipment - <small class=\"text-muted\">Asset - Fixed assets<\/small>"},
  {"id":85,"text":"Accrued non-current liabilities - <small class=\"text-muted\">Liability - Non-current liabilities<\/small>","html":"Accrued non-current liabilities - <small class=\"text-muted\">Liability - Non-current liabilities<\/small>"},
  {"id":86,"text":"Accrued liabilities - <small class=\"text-muted\">Liability - Current liabilities<\/small>","html":"Accrued liabilities - <small class=\"text-muted\">Liability - Current liabilities<\/small>"},
  {"id":87,"text":"Accrued holiday payable - <small class=\"text-muted\">Liability - Non-current liabilities<\/small>","html":"Accrued holiday payable - <small class=\"text-muted\">Liability - Non-current liabilities<\/small>"},
  {"id":88,"text":"Accounts Receivable (A\/R) - <small class=\"text-muted\">Asset - Accounts Receivable (A\/R)<\/small>","html":"Accounts Receivable (A\/R) - <small class=\"text-muted\">Asset - Accounts Receivable (A\/R)<\/small>"},
  {"id":89,"text":"Petty Cash - <small class=\"text-muted\">Asset - Current assets<\/small>","html":"Petty Cash - <small class=\"text-muted\">Asset - Current assets<\/small>"},
  {"id":90,"text":"KCB BANK - <small class=\"text-muted\">Asset - Current assets<\/small>","html":"KCB BANK - <small class=\"text-muted\">Asset - Current assets<\/small>"},
  {"id":91,"text":"MPESA - <small class=\"text-muted\">Asset - Current assets<\/small>","html":"MPESA - <small class=\"text-muted\">Asset - Current assets<\/small>"},
  {"id":92,"text":"Directors account - <small class=\"text-muted\">Liability - Current liabilities<\/small>","html":"Directors account - <small class=\"text-muted\">Liability - Current liabilities<\/small>"}
]

export async function GET() {
  try {
    let accounts = await prisma.chartOfAccounts.findMany({
      select: { id: true, accountCode: true, accountName: true, accountType: true, isActive: true, parentId: true },
      orderBy: [{ accountCode: 'asc' }]
    })

    if (accounts.length === 0) {
      // Seed defaults
      const typeMap: Record<string, 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'> = {
        asset: 'ASSET',
        liability: 'LIABILITY',
        equity: 'EQUITY',
        income: 'REVENUE',
        expenses: 'EXPENSE'
      }
      const counters: Record<string, number> = { ASSET: 1000, LIABILITY: 2000, EQUITY: 3000, REVENUE: 4000, EXPENSE: 5000 }

      const toCreate = DEFAULT_OPTIONS.map(opt => {
        const name = opt.text.split(' - <small')[0]
        const typeMatch = opt.text.match(/>([^<]+?)\s*-/i)
        const typeKey = typeMatch ? typeMatch[1].trim().toLowerCase() : 'expenses'
        const accountType = typeMap[typeKey] || 'EXPENSE'
        const code = String(counters[accountType]++)
        return {
          accountCode: code,
          accountName: name,
          accountType,
          isActive: true
        }
      })

      if (toCreate.length) {
        await prisma.chartOfAccounts.createMany({ data: toCreate, skipDuplicates: true })
      }

      accounts = await prisma.chartOfAccounts.findMany({
        select: { id: true, accountCode: true, accountName: true, accountType: true, isActive: true, parentId: true },
        orderBy: [{ accountCode: 'asc' }]
      })
    }

    return NextResponse.json({ items: accounts })
  } catch (e) {
    return NextResponse.json({ items: [] })
  }
}
