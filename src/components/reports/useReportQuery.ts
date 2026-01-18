"use client"

import useReportQueryJs from './useReportQuery'

type Params = Record<string, string>

const useReportQuery = useReportQueryJs as unknown as <T extends Params>(
  defaults?: T
) => {
  params: T
  setParams: (updates: Partial<T>) => void
}

export default useReportQuery
