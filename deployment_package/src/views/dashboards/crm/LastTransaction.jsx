'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import { useColorScheme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import OptionMenu from '@core/components/option-menu'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const statusObj = {
  COMPLETED: { text: 'Completed', color: 'success' },
  PENDING: { text: 'Pending', color: 'warning' },
  FAILED: { text: 'Failed', color: 'error' },
  REFUNDED: { text: 'Refunded', color: 'info' }
}

const LastTransaction = ({ transactions = [], serverMode }) => {
  // Hooks
  const { mode } = useColorScheme()

  // Vars
  const _mode = (mode === 'system' ? serverMode : mode) || serverMode

  // Helper to format date
  const formatDate = dateStr => {
    try {
      const date = new Date(dateStr)

      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return ''
    }
  }

  // Helper to format amount
  const formatAmount = amount => {
    const num = parseFloat(amount) || 0

    return `KSh ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Helper to get payment method display
  const getPaymentMethodDisplay = payment => {
    const method = payment.paymentMethod || 'CASH'

    switch (method) {
      case 'CARD':
        return {
          type: payment.cardType || 'Card',
          number: payment.cardLast4 ? `*${payment.cardLast4}` : '*****',
          imgName: payment.cardType?.toLowerCase() === 'visa' ? 'visa' : 'mastercard'
        }
      case 'MPESA':
        return { type: 'M-Pesa', number: payment.reference || 'M-Pesa', imgName: 'mastercard' }
      case 'CASH':
        return { type: 'Cash', number: 'Cash', imgName: 'visa' }
      case 'CHECK':
        return { type: 'Check', number: payment.checkNumber || 'Check', imgName: 'american-express' }
      default:
        return { type: method, number: method, imgName: 'visa' }
    }
  }

  // If no transactions, show message
  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader
          title='Last Transaction'
          action={<OptionMenu options={['Show all entries', 'Refresh', 'Download']} />}
        />
        <CardContent>
          <Typography variant='body2' color='text.secondary'>
            No recent transactions
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title='Last Transaction'
        action={<OptionMenu options={['Show all entries', 'Refresh', 'Download']} />}
      />
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead className='uppercase'>
            <tr className='border-be'>
              <th className='leading-6 plb-4 pis-6 pli-2'>Payment</th>
              <th className='leading-6 plb-4 pli-2'>Date</th>
              <th className='leading-6 plb-4 pli-2'>Status</th>
              <th className='leading-6 plb-4 pie-6 pli-2 text-right'>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 5).map((payment, index) => {
              const paymentDisplay = getPaymentMethodDisplay(payment)
              const status = payment.status || 'COMPLETED'
              const statusInfo = statusObj[status] || statusObj.COMPLETED

              return (
                <tr key={index} className='border-0'>
                  <td className='pis-6 pli-2 plb-3'>
                    <div className='flex items-center gap-4'>
                      <Avatar
                        variant='rounded'
                        className={classnames('is-[50px] bs-[30px]', {
                          'bg-white': _mode === 'dark',
                          'bg-actionHover': _mode === 'light'
                        })}
                      >
                        <img width={30} alt={paymentDisplay.imgName} src={`/images/logos/${paymentDisplay.imgName}.png`} />
                      </Avatar>
                      <div className='flex flex-col'>
                        <Typography color='text.primary'>{paymentDisplay.number}</Typography>
                        <Typography variant='body2' color='text.disabled'>
                          {paymentDisplay.type}
                        </Typography>
                      </div>
                    </div>
                  </td>
                  <td className='pli-2 plb-3'>
                    <div className='flex flex-col'>
                      <Typography color='text.primary'>Received</Typography>
                      <Typography variant='body2' color='text.disabled'>
                        {formatDate(payment.paymentDate)}
                      </Typography>
                    </div>
                  </td>
                  <td className='pli-2 plb-3'>
                    <Chip variant='tonal' size='small' label={statusInfo.text} color={statusInfo.color} />
                  </td>
                  <td className='pli-2 plb-3 pie-6 text-right'>
                    <Typography color='text.primary'>{formatAmount(payment.amount)}</Typography>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default LastTransaction
