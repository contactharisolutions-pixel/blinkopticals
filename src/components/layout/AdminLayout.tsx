import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check authentication storage parameter string set upon login verification
    const sessionStr = sessionStorage.getItem('erp_user')
    if (!sessionStr) {
      window.location.href = '/admin/login/'
    } else {
      setIsAuthenticated(true)
    }

    document.body.classList.add('admin-mode')
    return () => {
      document.body.classList.remove('admin-mode')
    }
  }, [])

  // Show nothing while evaluating secure redirection loop
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Verifying Workspace Token Security...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground selection:bg-primary/10 selection:text-primary animate-in fade-in duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="relative z-50">
          <Header />
        </div>
        <main
          className="flex-1 overflow-y-auto bg-muted/20 custom-scrollbar relative z-10"
          style={{ padding: '24px' }}
        >
          <div style={{ width: '100%' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
