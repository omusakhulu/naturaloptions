// Financial Reports Dashboard
'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  ButtonGroup,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Chip,
  Alert
} from '@mui/material'
import {
  GetApp,
  Print,
  Email,
  DateRange,
  TrendingUp,
  TrendingDown,
  Assessment,
  PieChart,
  BarChart
} from '@mui/icons-material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

const FinancialReports = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(2025, 0, 1), // Jan 1, 2025
    endDate: new Date(2025, 10, 6)   // Nov 6, 2025
  })
  const [reportPeriod, setReportPeriod] = useState('monthly')

  // Sample financial data
  const [profitLossData, setProfitLossData] = useState([
    {
      category: 'Revenue',
      accounts: [
        { name: 'Product Sales', amount: 100000.00, percentage: 79.8 },
        { name: 'Service Revenue', amount: 25430.50, percentage: 20.2 }
      ],
      total: 125430.50,
      type: 'revenue'
    },
    {
      category: 'Cost of Goods Sold',
      accounts: [
        { name: 'Cost of Goods Sold', amount: 65000.00, percentage: 100 }
      ],
      total: 65000.00,
      type: 'expense'
    },
    {
      category: 'Operating Expenses',
      accounts: [
        { name: 'Rent Expense', amount: 7200.00, percentage: 51.8 },
        { name: 'Marketing', amount: 4700.00, percentage: 33.8 },
        { name: 'Utilities', amount: 1200.25, percentage: 8.6 },
        { name: 'Office Supplies', amount: 820.00, percentage: 5.9 }
      ],
      total: 13920.25,
      type: 'expense'
    }
  ])

  const [balanceSheetData, setBalanceSheetData] = useState({
    assets: [
      {
        category: 'Current Assets',
        accounts: [
          { name: 'Cash and Cash Equivalents', amount: 32150.80 },
          { name: 'Accounts Receivable', amount: 15420.75 },
          { name: 'Inventory', amount: 45200.50 }
        ],
        total: 92772.05
      },
      {
        category: 'Fixed Assets',
        accounts: [
          { name: 'Equipment', amount: 25000.00 },
          { name: 'Furniture & Fixtures', amount: 8500.00 }
        ],
        total: 33500.00
      }
    ],
    liabilities: [
      {
        category: 'Current Liabilities',
        accounts: [
          { name: 'Accounts Payable', amount: 8930.50 },
          { name: 'Accrued Expenses', amount: 2150.00 }
        ],
        total: 11080.50
      }
    ],
    equity: [
      {
        category: 'Owner\'s Equity',
        accounts: [
          { name: 'Retained Earnings', amount: 68681.30 },
          { name: 'Current Year Earnings', amount: 46510.25 }
        ],
        total: 115191.55
      }
    ]
  })

  const [cashFlowData, setCashFlowData] = useState([
    {
      category: 'Operating Activities',
      items: [
        { name: 'Net Income', amount: 46510.25 },
        { name: 'Accounts Receivable Changes', amount: -2500.00 },
        { name: 'Inventory Changes', amount: -5000.00 },
        { name: 'Accounts Payable Changes', amount: 1200.00 }
      ],
      total: 40210.25
    },
    {
      category: 'Investing Activities',
      items: [
        { name: 'Equipment Purchase', amount: -5000.00 }
      ],
      total: -5000.00
    },
    {
      category: 'Financing Activities',
      items: [
        { name: 'Owner Contributions', amount: 10000.00 }
      ],
      total: 10000.00
    }
  ])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount))
  }

  const calculateGrossProfit = () => {
    const revenue = profitLossData.find(item => item.category === 'Revenue')?.total || 0
    const cogs = profitLossData.find(item => item.category === 'Cost of Goods Sold')?.total || 0
    return revenue - cogs
  }

  const calculateNetIncome = () => {
    return calculateGrossProfit() - (profitLossData.find(item => item.category === 'Operating Expenses')?.total || 0)
  }

  const ProfitLossReport = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><Typography variant="h6">Profit & Loss Statement</Typography></TableCell>
            <TableCell align="right"><Typography variant="h6">Amount</Typography></TableCell>
            <TableCell align="right"><Typography variant="h6">%</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {profitLossData.map((category) => (
            <>
              <TableRow key={category.category}>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                  {category.category}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                  {formatCurrency(category.total)}
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: 'grey.100' }}>
                  -
                </TableCell>
              </TableRow>
              {category.accounts.map((account) => (
                <TableRow key={account.name}>
                  <TableCell sx={{ pl: 4 }}>{account.name}</TableCell>
                  <TableCell align="right">{formatCurrency(account.amount)}</TableCell>
                  <TableCell align="right">{account.percentage?.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </>
          ))}
          
          {/* Calculated totals */}
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Gross Profit</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              {formatCurrency(calculateGrossProfit())}
            </TableCell>
            <TableCell align="right">
              {((calculateGrossProfit() / profitLossData.find(item => item.category === 'Revenue')?.total) * 100).toFixed(1)}%
            </TableCell>
          </TableRow>
          
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Net Income</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'primary.main' }}>
              {formatCurrency(calculateNetIncome())}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
              {((calculateNetIncome() / profitLossData.find(item => item.category === 'Revenue')?.total) * 100).toFixed(1)}%
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )

  const BalanceSheetReport = () => {
    const totalAssets = balanceSheetData.assets.reduce((sum, cat) => sum + cat.total, 0)
    const totalLiabilities = balanceSheetData.liabilities.reduce((sum, cat) => sum + cat.total, 0)
    const totalEquity = balanceSheetData.equity.reduce((sum, cat) => sum + cat.total, 0)

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>Assets</Typography>
            {balanceSheetData.assets.map((category) => (
              <Box key={category.category} sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {category.category}
                </Typography>
                {category.accounts.map((account) => (
                  <Box key={account.name} sx={{ display: 'flex', justifyContent: 'space-between', pl: 2, mb: 0.5 }}>
                    <Typography variant="body2">{account.name}</Typography>
                    <Typography variant="body2">{formatCurrency(account.amount)}</Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: 1, borderColor: 'divider', pt: 0.5 }}>
                  <Typography variant="body2">Total {category.category}</Typography>
                  <Typography variant="body2">{formatCurrency(category.total)}</Typography>
                </Box>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <Typography variant="h6">Total Assets</Typography>
              <Typography variant="h6" sx={{ color: 'success.main' }}>{formatCurrency(totalAssets)}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>Liabilities</Typography>
            {balanceSheetData.liabilities.map((category) => (
              <Box key={category.category} sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {category.category}
                </Typography>
                {category.accounts.map((account) => (
                  <Box key={account.name} sx={{ display: 'flex', justifyContent: 'space-between', pl: 2, mb: 0.5 }}>
                    <Typography variant="body2">{account.name}</Typography>
                    <Typography variant="body2">{formatCurrency(account.amount)}</Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: 1, borderColor: 'divider', pt: 0.5 }}>
                  <Typography variant="body2">Total {category.category}</Typography>
                  <Typography variant="body2">{formatCurrency(category.total)}</Typography>
                </Box>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <Typography variant="h6">Total Liabilities</Typography>
              <Typography variant="h6" sx={{ color: 'error.main' }}>{formatCurrency(totalLiabilities)}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Equity</Typography>
            {balanceSheetData.equity.map((category) => (
              <Box key={category.category} sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {category.category}
                </Typography>
                {category.accounts.map((account) => (
                  <Box key={account.name} sx={{ display: 'flex', justifyContent: 'space-between', pl: 2, mb: 0.5 }}>
                    <Typography variant="body2">{account.name}</Typography>
                    <Typography variant="body2">{formatCurrency(account.amount)}</Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: 1, borderColor: 'divider', pt: 0.5 }}>
                  <Typography variant="body2">Total {category.category}</Typography>
                  <Typography variant="body2">{formatCurrency(category.total)}</Typography>
                </Box>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <Typography variant="h6">Total Equity</Typography>
              <Typography variant="h6" sx={{ color: 'primary.main' }}>{formatCurrency(totalEquity)}</Typography>
            </Box>
          </Paper>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              Assets = Liabilities + Equity<br/>
              {formatCurrency(totalAssets)} = {formatCurrency(totalLiabilities)} + {formatCurrency(totalEquity)}
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    )
  }

  const CashFlowReport = () => {
    const netCashFlow = cashFlowData.reduce((sum, category) => sum + category.total, 0)

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="h6">Cash Flow Statement</Typography></TableCell>
              <TableCell align="right"><Typography variant="h6">Amount</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cashFlowData.map((category) => (
              <>
                <TableRow key={category.category}>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                    {category.category}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                    {formatCurrency(category.total)}
                  </TableCell>
                </TableRow>
                {category.items.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell sx={{ pl: 4 }}>{item.name}</TableCell>
                    <TableCell align="right" sx={{ color: item.amount >= 0 ? 'success.main' : 'error.main' }}>
                      {item.amount >= 0 ? '' : '('}{formatCurrency(item.amount)}{item.amount >= 0 ? '' : ')'}
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ))}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Net Cash Flow</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: netCashFlow >= 0 ? 'success.main' : 'error.main' }}>
                {netCashFlow >= 0 ? '' : '('}{formatCurrency(netCashFlow)}{netCashFlow >= 0 ? '' : ')'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Financial Reports
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive financial statements and analysis
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Print />}>
              Print
            </Button>
            <Button variant="outlined" startIcon={<GetApp />}>
              Export
            </Button>
            <Button variant="outlined" startIcon={<Email />}>
              Email
            </Button>
          </Box>
        </Box>

        {/* Date Range and Period Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={(newValue) => setDateRange({...dateRange, startDate: newValue})}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={(newValue) => setDateRange({...dateRange, endDate: newValue})}
                slotProps={{ textField: { size: 'small' } }}
              />
              <TextField
                select
                label="Period"
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </TextField>
              <Button variant="contained" startIcon={<Assessment />}>
                Generate Reports
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Profit & Loss" icon={<TrendingUp />} />
              <Tab label="Balance Sheet" icon={<BarChart />} />
              <Tab label="Cash Flow" icon={<PieChart />} />
            </Tabs>
          </Box>
          
          <CardContent sx={{ p: 3 }}>
            {activeTab === 0 && <ProfitLossReport />}
            {activeTab === 1 && <BalanceSheetReport />}
            {activeTab === 2 && <CashFlowReport />}
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  )
}

export default FinancialReports
