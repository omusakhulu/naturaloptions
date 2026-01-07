'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'

const SendMsgForm = ({ onSendMessage, isLoading, isBelowSmScreen }) => {
  const [msg, setMsg] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (msg.trim() && !isLoading) {
      onSendMessage(msg)
      setMsg('')
    }
  }

  const handleInputEndAdornment = () => {
    return (
      <div className='flex items-center gap-1'>
        {isLoading ? (
          <CircularProgress size={20} className='m-2' />
        ) : (
          <>
            {isBelowSmScreen ? (
              <IconButton variant='contained' color='primary' type='submit' disabled={!msg.trim()}>
                <i className='tabler-send' />
              </IconButton>
            ) : (
              <Button 
                variant='contained' 
                color='primary' 
                type='submit' 
                disabled={!msg.trim()}
                endIcon={<i className='tabler-send' />}
              >
                Send
              </Button>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit} className='p-6 border-bs bg-backgroundPaper'>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder='Ask me about products, prices, or recommendations...'
        value={msg}
        onChange={e => setMsg(e.target.value)}
        sx={{
          '& fieldset': { border: '0' },
          '& .MuiOutlinedInput-root': {
            background: 'var(--mui-palette-background-paper)',
            boxShadow: 'var(--mui-customShadows-xs) !important',
            paddingRight: '8px'
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e)
          }
        }}
        size='small'
        slotProps={{ input: { endAdornment: handleInputEndAdornment() } }}
        disabled={isLoading}
      />
    </form>
  )
}

export default SendMsgForm
