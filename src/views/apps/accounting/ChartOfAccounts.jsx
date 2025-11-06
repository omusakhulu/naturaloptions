// Chart of Accounts Management
'use client'

import { useState, useEffect } from 'react'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TreeView,
  TreeItem,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  ChevronRight,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Business
} from '@mui/icons-material'

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)

  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountType: '',
    parentId: '',
    description: ''
  })

  // Sample chart of accounts data
  const sampleAccounts = [
    {
      id: '1',
      accountCode: '1000',
      accountName: 'Cash and Cash Equivalents',
      accountType: 'ASSET',
      parentId: null,
      balance: 32150.80,
      children: [
        { id: '1-1', accountCode: '1001', accountName: 'Checking Account', accountType: 'ASSET', parentId: '1', balance: 25000.00 },
        { id: '1-2', accountCode: '1002', accountName: 'Savings Account', accountType: 'ASSET', parentId: '1', balance: 7000.80 },
        { id: '1-3', accountCode: '1003', accountName: 'Petty Cash', accountType: 'ASSET', parentId: '1', balance: 150.00 }
      ]
    },
    {
      id: '2',
      accountCode: '1200',
      accountName: 'Accounts Receivable',
      accountType: 'ASSET',
      parentId: null,
      balance: 15420.75,
      children: []
    },
    {
      id: '3',
      accountCode: '1300',
      accountName: 'Inventory',
      accountType: 'ASSET',
      parentId: null,
      balance: 45200.50,
      children: [
        { id: '3-1', accountCode: '1301', accountName: 'Raw Materials', accountType: 'ASSET', parentId: '3', balance: 20000.00 },
        { id: '3-2', accountCode: '1302', accountName: 'Finished Goods', accountType: 'ASSET', parentId: '3', balance: 25200.50 }
      ]
    },
    {
      id: '4',
      accountCode: '2000',
      accountName: 'Accounts Payable',
      accountType: 'LIABILITY',
      parentId: null,
      balance: 8930.50,
      children: []
    },
    {
      id: '5',
      accountCode: '4000',
      accountName: 'Sales Revenue',
      accountType: 'REVENUE',
      parentId: null,
      balance: 125430.50,
      children: [
        { id: '5-1', accountCode: '4001', accountName: 'Product Sales', accountType: 'REVENUE', parentId: '5', balance: 100000.00 },
        { id: '5-2', accountCode: '4002', accountName: 'Service Revenue', accountType: 'REVENUE', parentId: '5', balance: 25430.50 }
      ]
    },
    {
      id: '6',
      accountCode: '5000',
      accountName: 'Cost of Goods Sold',
      accountType: 'EXPENSE',
      parentId: null,
      balance: 65000.00,
      children: []
    },
    {
      id: '7',
      accountCode: '6000',
      accountName: 'Operating Expenses',
      accountType: 'EXPENSE',
      parentId: null,
      balance: 13920.25,
      children: [
        { id: '7-1', accountCode: '6001', accountName: 'Rent Expense', accountType: 'EXPENSE', parentId: '7', balance: 7200.00 },
        { id: '7-2', accountCode: '6002', accountName: 'Utilities', accountType: 'EXPENSE', parentId: '7', balance: 1200.25 },
        { id: '7-3', accountCode: '6003', accountName: 'Office Supplies', accountType: 'EXPENSE', parentId: '7', balance: 820.00 },
        { id: '7-4', accountCode: '6004', accountName: 'Marketing', accountType: 'EXPENSE', parentId: '7', balance: 4700.00 }
      ]
    }
  ]

  useEffect(() => {
    setAccounts(sampleAccounts)
  }, [])

  const accountTypes = [
    { value: 'ASSET', label: 'Asset', icon: <AccountBalance />, color: 'success' },
    { value: 'LIABILITY', label: 'Liability', icon: <TrendingDown />, color: 'error' },
    { value: 'EQUITY', label: 'Equity', icon: <Business />, color: 'info' },
    { value: 'REVENUE', label: 'Revenue', icon: <TrendingUp />, color: 'success' },
    { value: 'EXPENSE', label: 'Expense', icon: <AttachMoney />, color: 'warning' }
  ]

  const getAccountTypeConfig = (type) => {
    return accountTypes.find(t => t.value === type) || { color: 'default', icon: null }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleCreateAccount = () => {
    setSelectedAccount(null)
    setFormData({
      accountCode: '',
      accountName: '',
      accountType: '',
      parentId: '',
      description: ''
    })
    setDialogOpen(true)
  }

  const handleEditAccount = (account) => {
    setSelectedAccount(account)
    setFormData({
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountType: account.accountType,
      parentId: account.parentId || '',
      description: account.description || ''
    })
    setDialogOpen(true)
  }

  const handleSaveAccount = () => {
    // In a real app, this would make an API call
    console.log('Saving account:', formData)
    setDialogOpen(false)
  }

  const renderTreeItem = (account) => {
    const typeConfig = getAccountTypeConfig(account.accountType)

    return (
      <TreeItem
        key={account.id}
        nodeId={account.id}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {typeConfig.icon}
              <Box sx={{ ml: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {account.accountCode} - {account.accountName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {account.accountType}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(account.balance)}
              </Typography>
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation()
                handleEditAccount(account)
              }}>
                <Edit fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        }
      >
        {account.children?.map(child => renderTreeItem(child))}
      </TreeItem>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Chart of Accounts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your accounting structure and account hierarchy
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateAccount}
        >
          Add Account
        </Button>
      </Box>

      {/* Account Type Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Account Summary by Type</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {accountTypes.map((type) => {
            const typeAccounts = accounts.filter(acc => acc.accountType === type.value)
            const totalBalance = typeAccounts.reduce((sum, acc) => sum + acc.balance, 0)

            return (
              <Card key={type.value} sx={{ minWidth: 200 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {type.icon}
                    <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>
                      {type.label}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ color: `${type.color}.main` }}>
                    {formatCurrency(totalBalance)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {typeAccounts.length} accounts
                  </Typography>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </Box>

      {/* Account Tree */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Account Hierarchy</Typography>
          <TreeView
            defaultCollapseIcon={<ExpandMore />}
            defaultExpandIcon={<ChevronRight />}
            defaultExpanded={accounts.map(acc => acc.id)}
          >
            {accounts.map(account => renderTreeItem(account))}
          </TreeView>
        </CardContent>
      </Card>

      {/* Create/Edit Account Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedAccount ? 'Edit Account' : 'Create New Account'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Account Code"
              value={formData.accountCode}
              onChange={(e) => setFormData({...formData, accountCode: e.target.value})}
              fullWidth
              placeholder="e.g., 1001"
            />

            <TextField
              label="Account Name"
              value={formData.accountName}
              onChange={(e) => setFormData({...formData, accountName: e.target.value})}
              fullWidth
              placeholder="e.g., Checking Account"
            />

            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={formData.accountType}
                onChange={(e) => setFormData({...formData, accountType: e.target.value})}
                label="Account Type"
              >
                {accountTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {type.icon}
                      <Typography sx={{ ml: 1 }}>{type.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Parent Account (Optional)</InputLabel>
              <Select
                value={formData.parentId}
                onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                label="Parent Account (Optional)"
              >
                <MenuItem value="">None</MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.accountCode} - {account.accountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              fullWidth
              multiline
              rows={3}
              placeholder="Account description or notes..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveAccount}
            disabled={!formData.accountCode || !formData.accountName || !formData.accountType}
          >
            {selectedAccount ? 'Update' : 'Create'} Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ChartOfAccounts
