'use client'

// React Imports
import { useRef, useEffect } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import CardContent from '@mui/material/CardContent'

// Third-party Imports
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

const ScrollWrapper = ({ children, isBelowLgScreen, scrollRef, className }) => {
  if (isBelowLgScreen) {
    return (
      <div ref={scrollRef} className={classnames('bs-full overflow-y-auto overflow-x-hidden', className)}>
        {children}
      </div>
    )
  } else {
    return (
      <PerfectScrollbar ref={scrollRef} options={{ wheelPropagation: false }} className={className}>
        {children}
      </PerfectScrollbar>
    )
  }
}

const ChatLog = ({ chat, isBelowLgScreen, isBelowMdScreen, isBelowSmScreen }) => {
  const scrollRef = useRef(null)

  const scrollToBottom = () => {
    if (scrollRef.current) {
      if (isBelowLgScreen) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      } else {
        scrollRef.current._container.scrollTop = scrollRef.current._container.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [chat])

  return (
    <ScrollWrapper isBelowLgScreen={isBelowLgScreen} scrollRef={scrollRef} className='flex-grow'>
      <CardContent className='p-6 flex flex-col gap-4'>
        {chat.map((msg, index) => {
          const isSender = msg.sender === 'user'

          return (
            <div key={index} className={classnames('flex gap-4', { 'flex-row-reverse': isSender })}>
              {!isSender ? (
                <CustomAvatar color='primary' skin='light' size={32}>
                  <i className='tabler-robot' />
                </CustomAvatar>
              ) : (
                <CustomAvatar color='secondary' skin='light' size={32}>
                  <i className='tabler-user' />
                </CustomAvatar>
              )}
              <div
                className={classnames('flex flex-col gap-1', {
                  'items-end': isSender,
                  'max-is-[65%]': !isBelowMdScreen,
                  'max-is-[75%]': isBelowMdScreen && !isBelowSmScreen,
                  'max-is-[calc(100%-5.75rem)]': isBelowSmScreen
                })}
              >
                <Typography
                  className={classnames('whitespace-pre-wrap pli-4 plb-2 shadow-xs', {
                    'bg-backgroundPaper rounded-e rounded-b': !isSender,
                    'bg-primary text-[var(--mui-palette-primary-contrastText)] rounded-s rounded-b': isSender
                  })}
                  style={{ wordBreak: 'break-word' }}
                >
                  {msg.message}
                </Typography>
                <Typography variant='caption'>
                  {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </div>
            </div>
          )
        })}
      </CardContent>
    </ScrollWrapper>
  )
}

export default ChatLog
