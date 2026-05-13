import React, { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Skeleton } from '@/components/ui/skeleton'

interface LegacyModuleWrapperProps {
  moduleName: string
}

export const LegacyModuleWrapper: React.FC<LegacyModuleWrapperProps> = ({ moduleName }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isIframeLoaded, setIsIframeLoaded] = React.useState(false)
  const { user } = useAuthStore()

  const getLegacyViewName = (name: string) => {
    const map: Record<string, string> = {
      'orders': 'orders',
      'inventory': 'inventory',
      'customers': 'customers',
      'reports': 'reports',
      'purchase': 'purchase',
      'purchases': 'purchase',
      'staff': 'staff',
      'appointment': 'appointments',
      'appointments': 'appointments',
      'cms': 'cms',
      'master': 'master',
      'master_data': 'master',
      'pos': 'pos',
      'pos_order': 'pos_order',
      'ecommerce': 'ecommerce',
      'bulk_import': 'bulk_import',
      'ai_filler': 'ai_filler',
      'media': 'media',
      'transfers': 'transfers',
      'accounting': 'accounting',
      'crm': 'crm',
      'eyetests': 'eyetests',
      'repairs': 'repairs',
      'loyalty': 'loyalty',
      'offers': 'offers',
      'coupons': 'coupons',
      'campaigns': 'campaigns',
      'invoices': 'invoices',
      'return_customer': 'return_customer',
      'return_vendor': 'return_vendor',
      'damaged_goods': 'damaged_goods',
      'logistics': 'logistics'
    }
    return map[name] || name
  }

  // Use a constant URL so the iframe doesn't reload when switching modules
  const legacyUrl = `/legacy/admin/dashboard?iframe=true`

  useEffect(() => {
    if (isIframeLoaded && iframeRef.current?.contentWindow) {
      // Sync auth state as a backup (belt-and-suspenders)
      if (user) {
        iframeRef.current.contentWindow.postMessage({ 
          type: 'SYNC_AUTH', 
          user: {
            ...user,
            permissions: user.permissions || []
          } 
        }, '*')
      }

      iframeRef.current.contentWindow.postMessage({ 
        type: 'SWITCH_VIEW', 
        view: getLegacyViewName(moduleName) 
      }, '*')
    }
  }, [moduleName, isIframeLoaded, user])

  return (
    <div className="w-full h-[calc(100vh-56px)] relative rounded-xl overflow-hidden bg-background border border-border/50 shadow-sm animate-in fade-in duration-300">
      {!isIframeLoaded && (
        <div className="absolute inset-0 p-6 flex flex-col gap-4 bg-background z-10">
          <Skeleton className="h-10 w-1/4" />
          <div className="flex gap-4">
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      )}
      <iframe 
        ref={iframeRef}
        src={legacyUrl}
        className="w-full h-full border-none"
        onLoad={() => {
          setIsIframeLoaded(true)
        }}
      />
    </div>
  )
}
