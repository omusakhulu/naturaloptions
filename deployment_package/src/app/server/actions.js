/**
 * ! The server actions below are used to fetch the static data from the fake-db. If you're using an ORM
 * ! (Object-Relational Mapping) or a database, you can swap the code below with your own database queries.
 */
'use server'

// Data Imports
import { db as eCommerceData } from '@/fake-db/apps/ecommerce'
import { db as academyData } from '@/fake-db/apps/academy'
import { db as vehicleData } from '@/fake-db/apps/logistics'
import { db as invoiceData } from '@/fake-db/apps/invoice'
import { db as userData } from '@/fake-db/apps/userList'
import { db as profileData } from '@/fake-db/pages/userProfile'
import { db as faqData } from '@/fake-db/pages/faq'
import { db as pricingData } from '@/fake-db/pages/pricing'
import { db as statisticsData } from '@/fake-db/pages/widgetExamples'

export const getEcommerceData = async () => {
  return eCommerceData
}

export const getAcademyData = async () => {
  return academyData
}

export const getLogisticsData = async () => {
  return vehicleData
}

export const getInvoiceData = async () => {
  return invoiceData
}

export const getUserData = async () => {
  return userData
}

export const getPermissionsData = async () => {
  return [
    { id: 1, name: 'User Management', assignedTo: ['SUPER_ADMIN', 'ADMIN'], createdDate: '14 Apr 2021, 8:43 PM' },
    { id: 2, name: 'Manage Roles', assignedTo: ['SUPER_ADMIN', 'ADMIN'], createdDate: '16 Sep 2021, 5:20 PM' },
    { id: 3, name: 'Manage Projects', assignedTo: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'], createdDate: '14 Oct 2021, 10:20 AM' },
    { id: 4, name: 'View Reports', assignedTo: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALES'], createdDate: '23 Aug 2021, 2:00 PM' },
    { id: 5, name: 'Accounting', assignedTo: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], createdDate: '25 Feb 2021, 10:30 AM' },
    { id: 6, name: 'Operate POS', assignedTo: ['SUPER_ADMIN', 'ADMIN', 'CASHIER'], createdDate: '04 Nov 2021, 11:45 AM' },
    { id: 7, name: 'Basic Access', assignedTo: 'USER', createdDate: '04 Dec 2021, 8:15 PM' }
  ]
}

export const getProfileData = async () => {
  return profileData
}

export const getFaqData = async () => {
  return faqData
}

export const getPricingData = async () => {
  return pricingData
}

export const getStatisticsData = async () => {
  return statisticsData
}
