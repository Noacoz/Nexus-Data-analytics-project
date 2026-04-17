export const sidebarItems = [
  { label: 'Dashboard', route: '/dashboard', icon: '📊', section: 'core' },
  { label: 'Datasets', route: '/datasets', icon: '🗂️', section: 'core' },
  { label: 'Data Explorer', route: '/data-explorer', icon: '🧭', section: 'core' },
  { label: 'Analysis / Models', route: '/analysis', icon: '📈', section: 'core' },
  { label: 'AI Analyst', route: '/ai-analyst', icon: '🤖', section: 'core' },
  { label: 'Insights', route: '/insights', icon: '💡', section: 'core' },
  { label: 'Reports', route: '/reports', icon: '📋', section: 'core' },
  { label: 'Monitoring', route: '/monitoring', icon: '🚨', section: 'operations' },
  { label: 'Workflows', route: '/workflows', icon: '⚙️', section: 'operations' },
  { label: 'Team', route: '/team', icon: '👥', section: 'admin' },
  { label: 'System Logs', route: '/system-logs', icon: '📝', section: 'admin' },
  { label: 'Audit', route: '/audit', icon: '🔎', section: 'admin' },
  { label: 'Settings', route: '/settings', icon: '⚙️', section: 'admin' },
]

export const sidebarSections = [
  { key: 'core', title: 'Core Platform' },
  { key: 'operations', title: 'Monitoring & Automation' },
  { key: 'admin', title: 'System Controls' },
]
