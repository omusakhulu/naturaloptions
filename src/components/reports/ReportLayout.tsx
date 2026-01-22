"use client"

import React from 'react'
import ReportLayoutJs from './ReportLayout.jsx'

export type Breadcrumb = {
  label: string
  href?: string
}

export type ReportLayoutProps = {
  title: string
  breadcrumbs?: Breadcrumb[]
  description?: string
  actions?: React.ReactNode
  filters?: React.ReactNode
  children?: React.ReactNode
}

const ReportLayout = ReportLayoutJs as unknown as React.FC<ReportLayoutProps>

export default ReportLayout
