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
import { AdapterDateFnsV3 } from '@mui/x-date-pickers/AdapterDateFnsV3'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

const FinancialReports = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1), // Jan 1 of current year
    endDate: new Date()
  })
  const [reportPeriod, setReportPeriod] = useState('monthly')

  const [profitLossData, setProfitLossData] = useState([])
  const [balanceSheetData, setBalanceSheetData] = useState({
    assets: [],
    liabilities: [],
    equity: 0
  })
  const [cashFlowData, setCashFlowData] = useState({
    series: [],
    totals: { inflow: 0, outflow: 0, net: 0 }
  })

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      try {
        const after = dateRange.startDate.toISOString().split('T')[0]
        const before = dateRange.endDate.toISOString().split('T')[0]

        const [bsRes, cfRes] = await Promise.all([
          fetch('/api/accounting/balance-sheet'),
          fetch(`/api/accounting/cash-flow?after=${after}&before=${before}`)
        ])

        const bsData = await bsRes.json()
        const cfData = await cfRes.json()

        setBalanceSheetData({
          assets: [
            {
              category: 'Current Assets',
              accounts: [
                { name: 'Cash and Cash Equivalents', amount: bsData.assets?.cashBank || 0 },
                { name: 'Accounts Receivable', amount: bsData.assets?.accountsReceivable || 0 },
                { name: 'Inventory', amount: bsData.assets?.inventory || 0 }
              ],
              total: bsData.assets?.total || 0
            }
          ],
          liabilities: [
            {
              category: 'Current Liabilities',
              accounts: [
                { name: 'Accounts Payable', amount: bsData.liabilities?.accountsPayable || 0 }
              ],
              total: bsData.liabilities?.total || 0
            }
          ],
          equity: bsData.equity || 0
        })

        setCashFlowData(cfData)

        // For Profit & Loss, we'll derive it from Cash Flow inflows/outflows for now
        // In a real scenario, this should come from a dedicated P&L API
        setProfitLossData([
          {
            category: 'Revenue',
            accounts: [
              { name: 'Total Revenue', amount: cfData.totals?.inflow || 0, percentage: 100 }
            ],
            total: cfData.totals?.inflow || 0,
            type: 'revenue'
          },
          {
            category: 'Expenses',
            accounts: [
              { name: 'Total Expenses', amount: cfData.totals?.outflow || 0, percentage: 100 }
            ],
            total: cfData.totals?.outflow || 0,
            type: 'expense'
          }
        ])
      } catch (err) {
        console.error('Error fetching financial reports:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [dateRange])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount))
  }

  const calculateGrossProfit = () => {
    const revenue = profitLossData.find(item => item.type === 'revenue')?.total || 0
    return revenue
  }

  const calculateNetIncome = () => {
    const revenue = profitLossData.find(item => item.type === 'revenue')?.total || 0
    const expenses = profitLossData.find(item => item.type === 'expense')?.total || 0
    return revenue - expenses
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
              {category.accounts.map((account, idx) => (
                <TableRow key={`${category.category}-${idx}`}>
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
    const totalEquity = balanceSheetData.equity

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
                {category.accounts.map((account, idx) => (
                  <Box key={`assets-${category.category}-${idx}`} sx={{ display: 'flex', justifyContent: 'space-between', pl: 2, mb: 0.5 }}>
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
                {category.accounts.map((account, idx) => (
                  <Box key={`liabilities-${category.category}-${idx}`} sx={{ display: 'flex', justifyContent: 'space-between', pl: 2, mb: 0.5 }}>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <Typography variant="body1">Owner's Equity</Typography>
              <Typography variant="body1">{formatCurrency(totalEquity)}</Typography>
            </Box>
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
    const netCashFlow = cashFlowData.totals?.net || 0

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
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                Total Cash Inflow
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.100', color: 'success.main' }}>
                {formatCurrency(cashFlowData.totals?.inflow || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                Total Cash Outflow
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.100', color: 'error.main' }}>
                ({formatCurrency(cashFlowData.totals?.outflow || 0)})
              </TableCell>
            </TableRow>
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
    <LocalizationProvider dateAdapter={AdapterDateFnsV3}>
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
