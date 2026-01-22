// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'

// Third-party Imports
import classnames from 'classnames'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const defaultSuggestions = []

const DefaultSuggestions = ({ setOpen }) => {
  // Hooks
  const { lang: locale } = useParams()

  return (
    <Box sx={{ width: '100%', p: 3, overflow: 'auto' }}>
      <Grid container rowSpacing={4} columnSpacing={{ xs: 2, sm: 2, md: 3 }}>
        {defaultSuggestions.map(section =>
          section.items.map((item, i) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`${section.sectionLabel}-${i}`}>
              <Link
                href={getLocalizedUrl(item.href, locale)}
                className='flex flex-col items-center justify-center gap-3 p-4 rounded-lg bg-backgroundPaper border border-divider hover:border-primary hover:shadow-md transition-all cursor-pointer group h-full'
                onClick={() => setOpen(false)}
              >
                {item.icon && (
                  <i
                    className={classnames(
                      item.icon,
                      'text-4xl text-textSecondary group-hover:text-primary transition-colors'
                    )}
                  />
                )}
                <p className='text-sm font-medium text-center group-hover:text-primary transition-colors'>
                  {item.label}
                </p>
              </Link>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  )
}

export default DefaultSuggestions
