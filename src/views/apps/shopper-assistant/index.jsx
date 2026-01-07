'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'

// Component Imports
import ChatLog from './ChatLog'
import SendMsgForm from './SendMsgForm'
import CustomAvatar from '@core/components/mui/Avatar'

const ShopperAssistant = () => {
  const [chat, setChat] = useState([
    {
      message: 'Hello! I am your Natural Options Assistant. How can I help you find the perfect products today?',
      sender: 'ai',
      time: new Date()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

  // Hooks
  const isBelowLgScreen = useMediaQuery(theme => theme.breakpoints.down('lg'))
  const isBelowMdScreen = useMediaQuery(theme => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery(theme => theme.breakpoints.down('sm'))

  const handleSendMessage = async (message) => {
    // Add user message to chat
    const userMsg = { message, sender: 'user', time: new Date() }
    const updatedChat = [...chat, userMsg]
    setChat(updatedChat)
    setIsLoading(true)

    try {
      // Prepare history for Gemini: only send messages after the initial greeting
      // to ensure history starts with a 'user' role message.
      const history = chat
        .filter((_, index) => index > 0)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.message }]
        }))

      const response = await fetch('/api/ai/shopper-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      })

      const data = await response.json()

      if (data.response) {
        setChat(prev => [...prev, {
          message: data.response,
          sender: 'ai',
          time: new Date()
        }])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat Error:', error)
      let errorMessage = 'Sorry, I encountered an error. Please try again.'
      
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        errorMessage = 'I have reached my message limit for the moment. Please wait a minute and try again.'
      }
      
      setChat(prev => [...prev, {
        message: errorMessage,
        sender: 'ai',
        time: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className='flex flex-col overflow-hidden bs-full shadow-md bg-backgroundChat'>
      {/* Header */}
      <div className='flex items-center gap-4 p-4 border-be bg-backgroundPaper'>
        <CustomAvatar color='primary' skin='light' size={40}>
          <i className='tabler-robot' />
        </CustomAvatar>
        <div>
          <Typography variant='h6' color='text.primary'>AI Shopper Assistant</Typography>
          <Typography variant='body2' color='success.main'>Online | Powered by Gemini</Typography>
        </div>
      </div>

      {/* Chat Content */}
      <div className='flex flex-col flex-grow overflow-hidden'>
        <ChatLog 
          chat={chat} 
          isBelowLgScreen={isBelowLgScreen}
          isBelowMdScreen={isBelowMdScreen}
          isBelowSmScreen={isBelowSmScreen}
        />
        
        <SendMsgForm 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading}
          isBelowSmScreen={isBelowSmScreen}
        />
      </div>
    </Card>
  )
}

export default ShopperAssistant
