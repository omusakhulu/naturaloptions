// Accounting Dashboard
'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  AccountBalance,
  Warning,
  CheckCircle,
  Schedule,
  AttachMoney,
  Assessment
} from '@mui/icons-material'

const AccountingDashboard = () => {
  const [loading, setLoading] = useState(true)

  // Sample financial data - Replace with real data
  const [financialSummary, setFinancialSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    accountsReceivable: 15420.75, // Mock
    accountsPayable: 8930.50,     // Mock
    cashBalance: 32150.80         // Mock
  })

  const [recentTransactions, setRecentTransactions] = useState([])

  const [outstandingInvoices, setOutstandingInvoices] = useState([
    { id: 'INV-001', customer: 'ABC Corp', amount: 1250.00, dueDate: '2025-11-10', overdue: false },
    { id: 'INV-002', customer: 'XYZ Ltd', amount: 750.50, dueDate: '2025-11-08', overdue: true },
    { id: 'INV-003', customer: 'Tech Solutions', amount: 2100.00, dueDate: '2025-11-15', overdue: false }
  ])

  const [accountingMetrics, setAccountingMetrics] = useState({
    monthlyRevenue: { current: 0, previous: 0, growth: 0 },
    averageTransaction: { current: 0, previous: 0, growth: 0 },
    customerPayments: { pending: 8, completed: 45, overdue: 3 }
  })

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Date range: First day of current month to now
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const endOfToday = now.toISOString()

        // 1. Fetch Sales (Revenue)
        const salesRes = await fetch(`/api/pos/sales?startDate=${startOfMonth}&endDate=${endOfToday}&limit=10`)
        const salesData = await salesRes.json()

        // 2. Fetch Expenses
        const expensesRes = await fetch(`/api/expenses?after=${startOfMonth}&before=${endOfToday}`)
        const expensesData = await expensesRes.json()

        if (salesData.success && expensesData) {
          const totalRevenue = salesData.summary.totalAmount || 0
          const totalExpenses = expensesData.total || 0
          const netIncome = totalRevenue - totalExpenses

          setFinancialSummary(prev => ({
            ...prev,
            totalRevenue,
            totalExpenses,
            netIncome
          }))

          // Merge and format transactions
          const salesTransactions = (salesData.sales || []).map(sale => ({
            id: sale.id,
            date: new Date(sale.saleDate).toLocaleDateString(),
            rawDate: new Date(sale.saleDate),
            description: `Sale #${sale.saleNumber}`,
            amount: sale.total,
            type: 'income',
            status: 'completed'
          }))

          const expenseTransactions = (expensesData.items || []).map(exp => ({
            id: exp.id,
            date: new Date(exp.date).toLocaleDateString(),
            rawDate: new Date(exp.date),
            description: exp.category || 'Expense',
            amount: -exp.amount, // Negative for display logic if needed, or handle in UI
            type: 'expense',
            status: 'completed'
          }))

          const allTransactions = [...salesTransactions, ...expenseTransactions]
            .sort((a, b) => b.rawDate - a.rawDate)
            .slice(0, 10)

          setRecentTransactions(allTransactions)
        }
      } catch (error) {
        console.error('Failed to fetch accounting data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'overdue': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Accounting Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Financial overview and key metrics for Natural Options
        </Typography>
      </Box>

      {/* Financial Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6">Total Revenue</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                {formatCurrency(financialSummary.totalRevenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                +14.8% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="h6">Total Expenses</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                {formatCurrency(financialSummary.totalExpenses)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                +5.2% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Net Income</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                {formatCurrency(financialSummary.netIncome)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                +32.1% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Receipt sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6">Accounts Receivable</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'info.main', fontWeight: 'bold' }}>
                {formatCurrency(financialSummary.accountsReceivable)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3 outstanding invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CreditCard sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">Accounts Payable</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                {formatCurrency(financialSummary.accountsPayable)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2 bills due this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalance sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6">Cash Balance</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                {formatCurrency(financialSummary.cashBalance)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available for operations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Recent Transactions</Typography>
                <Button variant="outlined" size="small">
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              color: transaction.amount > 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}
                          >
                            {formatCurrency(Math.abs(transaction.amount))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.status}
                            color={getStatusColor(transaction.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Outstanding Invoices */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Outstanding Invoices</Typography>
                <Button variant="outlined" size="small">
                  Create Invoice
                </Button>
              </Box>
              <List>
                {outstandingInvoices.map((invoice, index) => (
                  <div key={invoice.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        {invoice.overdue ? (
                          <Warning sx={{ color: 'error.main' }} />
                        ) : (
                          <Schedule sx={{ color: 'warning.main' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {invoice.id}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(invoice.amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {invoice.customer}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: invoice.overdue ? 'error.main' : 'text.secondary' }}
                            >
                              Due: {invoice.dueDate}
                              {invoice.overdue && ' (Overdue)'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < outstandingInvoices.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button variant="contained" startIcon={<Receipt />}>
              Create Invoice
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" startIcon={<CreditCard />}>
              Record Payment
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" startIcon={<Assessment />}>
              Financial Reports
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" startIcon={<AccountBalance />}>
              Bank Reconciliation
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default AccountingDashboard
