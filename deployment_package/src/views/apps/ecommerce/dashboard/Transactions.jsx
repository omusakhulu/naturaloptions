// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

const toMoney = v => `KSh ${Number.parseFloat(v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const Transactions = ({ transactions = [] }) => {
  return (
    <Card className='flex flex-col'>
      <CardHeader
        title='Transactions'
        subheader={`${transactions.length} recent entries`}
        action={<OptionMenu options={['Refresh', 'Show all entries', 'Make payment']} />}
      />
      <CardContent className='flex grow gap-y-[18px] lg:gap-y-5 flex-col justify-between max-sm:gap-5'>
        {transactions.map((item, index) => (
          <div key={index} className='flex items-center gap-3 lg:gap-4'>
            <CustomAvatar variant='rounded' skin='light' color={item.avatarColor} size={42}>
              <i className={classnames(item.avatarIcon, 'text-[26px]')} />
            </CustomAvatar>
            <div className='flex justify-between items-center is-full flex-wrap gap-x-4 gap-y-1'>
              <div className='flex flex-col gap-0.5'>
                <Typography variant='h6'>{item.title}</Typography>
                <Typography variant='body2' color='text.disabled'>
                  {item.subtitle}
                </Typography>
              </div>
              <Typography
                variant='h6'
                color={`${item.amount < 0 ? 'error' : 'success'}.main`}
              >{`${item.amount < 0 ? '-' : '+'}KSh ${Number.parseFloat(Math.abs(item.amount) || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Typography>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default Transactions
