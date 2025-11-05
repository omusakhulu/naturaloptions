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

const toMoney = v => `${Number.parseFloat(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

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
          <div key={index} className='flex items-center gap-4'>
            <CustomAvatar skin='light' variant='rounded' color={item.avatarColor} size={34}>
              <i className={classnames(item.avatarIcon, 'text-[22px]')} />
            </CustomAvatar>
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{item.subtitle}</Typography>
              </div>
              <Typography
                variant='h6'
                color={`${item.amount < 0 ? 'error' : 'success'}.main`}
              >{`${item.amount < 0 ? '-' : '+'}$${toMoney(Math.abs(item.amount))}`}</Typography>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default Transactions
