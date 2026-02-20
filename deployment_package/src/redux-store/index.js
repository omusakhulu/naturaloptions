// Third-party Imports
import { configureStore, isRejectedWithValue } from '@reduxjs/toolkit'

// Slice Imports
import chatReducer from '@/redux-store/slices/chat'
import calendarReducer from '@/redux-store/slices/calendar'
import kanbanReducer from '@/redux-store/slices/kanban'
import emailReducer from '@/redux-store/slices/email'

// RTK Query
import { baseApi } from '@/redux-store/api/baseApi'

/**
 * RTK Query error logging middleware.
 * Catches rejected API calls so unhandled errors don't crash the store.
 */
const rtkQueryErrorLogger = () => next => action => {
  if (isRejectedWithValue(action)) {
    console.error('RTK Query error:', {
      endpoint: action.meta?.arg?.endpointName,
      status: action.payload?.status,
      error: action.payload?.data?.error || action.error?.message
    })
  }

  return next(action)
}

export const store = configureStore({
  reducer: {
    chatReducer,
    calendarReducer,
    kanbanReducer,
    emailReducer,
    [baseApi.reducerPath]: baseApi.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false }).concat(baseApi.middleware).concat(rtkQueryErrorLogger)
})
