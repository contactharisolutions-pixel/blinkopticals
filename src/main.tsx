import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import Dashboard from '@/modules/Dashboard'
import SettingsPage from '@/modules/Settings'
import ChatManagement from '@/modules/Chat'
import SeoManagementWorkspace from '@/modules/SEO'
import { useAppStore } from '@/store/useAppStore'
import { LegacyModuleWrapper } from '@/components/layout/LegacyModuleWrapper'

const queryClient = new QueryClient()

const AppContent: React.FC = () => {
  const { currentModule } = useAppStore()

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard />
      case 'settings':
        return <SettingsPage />
      case 'chat':
        return <ChatManagement />
      case 'seo':
        return <SeoManagementWorkspace />
      default:
        // Use the wrapper for 'orders', 'inventory', 'customers', 'reports', 'cms'
        return <LegacyModuleWrapper moduleName={currentModule} />
    }
  }

  return (
    <AdminLayout>
      {renderModule()}
    </AdminLayout>
  )
}

import { Toaster } from 'sonner'

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AppContent />} />
          <Route path="/admin/*" element={<AppContent />} />
          {/* Redirect any other path to admin dashboard */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
