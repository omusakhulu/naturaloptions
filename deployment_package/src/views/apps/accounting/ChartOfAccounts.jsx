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
  Alert,
  CircularProgress
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)

  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountType: '',
    parentId: '',
    description: ''
  })

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/accounting/chart-of-accounts')
        const data = await response.json()
        if (data.tree) {
          setAccounts(data.tree)
        } else {
          setError('Failed to load chart of accounts')
        }
      } catch (err) {
        console.error('Error fetching accounts:', err)
        setError('Connection error')
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
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
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
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
    const typeConfig = getAccountTypeConfig(account.type)

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
                  {account.code} - {account.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {account.type}
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
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {accountTypes.map((type) => {
              const flattened = [];
              const flatten = (nodes) => {
                nodes.forEach(n => {
                  flattened.push(n);
                  if (n.children) flatten(n.children);
                });
              };
              flatten(accounts);
              const typeAccounts = flattened.filter(acc => acc.type === type.value)
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
        )}
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
