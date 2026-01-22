'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  Dialog, 
  DialogContent, 
  TextField, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  Paper,
  Tab,
  Tabs
} from '@mui/material'
import { styled } from '@mui/material/styles'

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    width: '100%',
    maxWidth: 800,
    maxHeight: '80vh',
    margin: theme.spacing(2)
  }
}))

const SearchResult = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}))

const TypeChip = styled(Chip)(({ theme }) => ({
  fontSize: '0.75rem',
  height: 20,
  marginLeft: theme.spacing(1)
}))

const getTypeColor = (type) => {
  const colors = {
    'page': 'info',
    'product': 'primary',
    'customer': 'secondary',
    'order': 'info',
    'invoice': 'warning',
    'project': 'success',
    'boq': 'error',
    'quote': 'primary',
    'warehouse': 'secondary',
    'driver': 'info',
    'vehicle': 'warning',
    'pos-sale': 'success',
    'user': 'error',
    'expense': 'primary',
    'packing-slip': 'secondary'
  }
  return colors[type] || 'default'
}

const getTypeLabel = (type) => {
  const labels = {
    'page': 'Page',
    'product': 'Product',
    'customer': 'Customer',
    'order': 'Order',
    'invoice': 'Invoice',
    'project': 'Project',
    'boq': 'BOQ',
    'quote': 'Quote',
    'warehouse': 'Warehouse',
    'driver': 'Driver',
    'vehicle': 'Vehicle',
    'pos-sale': 'POS Sale',
    'user': 'User',
    'expense': 'Expense',
    'packing-slip': 'Packing Slip'
  }
  return labels[type] || type
}

const allTypes = [
  { value: 'all', label: 'All' },
  { value: 'pages', label: 'Pages' },
  { value: 'products', label: 'Products' },
  { value: 'customers', label: 'Customers' },
  { value: 'orders', label: 'Orders' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'boqs', label: 'BOQs' },
  { value: 'sales', label: 'POS Sales' },
  { value: 'users', label: 'Users' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'packing-slips', label: 'Packing Slips' }
]

export default function GlobalSearch({ open, onClose }) {
  const router = useRouter()
  const { lang } = useParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchTimeoutRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(() => {
        performSearch()
      }, 300)
    } else {
      setResults([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, selectedType])

  const performSearch = async () => {
    setLoading(true)
    try {
      const types = selectedType === 'all' ? '' : selectedType
      const response = await fetch(
        `/api/global-search?q=${encodeURIComponent(searchQuery)}&types=${types}&limit=50`
      )
      const data = await response.json()
      console.log('Search response:', data)
      
      if (data.success) {
        setResults(data.results || [])
      } else {
        console.error('Search failed:', data.error)
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result) => {
    // Handle page navigation with special cases
    if (result.type === 'page') {
      // Check if the URL should exclude language prefix
      if (result.metadata?.excludeLang || result.url.startsWith('http')) {
        // External URL or pages that should not have language prefix
        if (result.url.startsWith('http')) {
          window.open(result.url, '_blank')
        } else {
          router.push(result.url)
        }
      } else {
        // Add language prefix if not present
        const url = lang ? `/${lang}${result.url}` : result.url
        router.push(url)
      }
    } else {
      // Regular data items - add language prefix
      const url = result.url.startsWith('/') && lang 
        ? `/${lang}${result.url}` 
        : result.url
      router.push(url)
    }
    handleClose()
  }

  const handleClose = () => {
    setSearchQuery('')
    setResults([])
    setSelectedType('all')
    setSelectedIndex(0)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleResultClick(results[selectedIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    }
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {})

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            placeholder="Search for products, orders, customers, projects, and more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="tabler-search" />
                </InputAdornment>
              ),
              endAdornment: loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    edge="end"
                  >
                    <i className="tabler-x" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  border: 'none'
                }
              }
            }}
          />
          
          {searchQuery.length >= 2 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Tabs
                value={selectedType}
                onChange={(e, newValue) => setSelectedType(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ minHeight: 32 }}
              >
                {allTypes.map(type => (
                  <Tab
                    key={type.value}
                    label={type.label}
                    value={type.value}
                    sx={{ minHeight: 32, py: 0 }}
                  />
                ))}
              </Tabs>
            </Box>
          )}
        </Box>

        <Box sx={{ maxHeight: 'calc(80vh - 140px)', overflow: 'auto' }}>
          {searchQuery.length < 2 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <i className="tabler-search" style={{ fontSize: 48 }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Start typing to search
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Search for products, orders, customers, invoices, projects, and more
              </Typography>
            </Box>
          ) : results.length === 0 && !loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <i className="tabler-search-off" style={{ fontSize: 48 }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                No results found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try searching with different keywords
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 1 }}>
              {Object.entries(groupedResults).map(([type, items], groupIndex) => (
                <Box key={type}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ px: 2, py: 1, display: 'block', fontWeight: 600 }}
                  >
                    {getTypeLabel(type)} ({items.length})
                  </Typography>
                  {items.map((result) => (
                    <SearchResult
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      selected={results.indexOf(result) === selectedIndex}
                    >
                      <ListItemIcon>
                        <i className={result.icon} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">
                              {result.title}
                            </Typography>
                            <TypeChip
                              label={getTypeLabel(result.type)}
                              color={getTypeColor(result.type)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box component="span" sx={{ display: 'block' }}>
                            {result.subtitle && (
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                                {result.subtitle}
                              </Typography>
                            )}
                            {result.description && (
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {result.description}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </SearchResult>
                  ))}
                  {groupIndex < Object.keys(groupedResults).length - 1 && (
                    <Divider sx={{ my: 1 }} />
                  )}
                </Box>
              ))}
            </List>
          )}
        </Box>

        {results.length > 0 && (
          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              <i className="tabler-arrow-up" style={{ fontSize: 14 }} /> <i className="tabler-arrow-down" style={{ fontSize: 14 }} /> to navigate
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <i className="tabler-corner-down-left" style={{ fontSize: 14 }} /> to select
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ESC to close
            </Typography>
          </Box>
        )}
      </DialogContent>
    </StyledDialog>
  )
}
