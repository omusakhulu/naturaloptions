// Dashboard layout - should NOT render html/body tags
// The main layouts handle that
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
