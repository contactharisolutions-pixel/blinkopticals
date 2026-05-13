import React from 'react'
import { cn } from '@/lib/utils'
import {
  Building2, Store, Users, ShieldCheck, BellRing, Palette,
  CreditCard, Mail, Truck, ReceiptText, ShieldAlert, Hash, Settings2, Globe
} from 'lucide-react'
import { BusinessProfile } from './BusinessProfile'
import { ShowroomManagement } from './ShowroomManagement'
import { StaffManagement } from './StaffManagement'
import { AccessSettings } from './AccessSettings'
import { SecuritySettings } from './SecuritySettings'
import { NotificationsSettings } from './NotificationsSettings'
import { AppearanceSettings } from './AppearanceSettings'
import { PaymentSettings } from './PaymentSettings'
import { EmailSettings } from './EmailSettings'
import { LogisticSettings } from './LogisticSettings'
import { TaxSettings } from './TaxSettings'
import { PrefixSettings } from './PrefixSettings'
import { TrackingSettings } from './TrackingSettings'

const NAV_GROUPS = [
  {
    label: 'Business',
    items: [
      { id: 'business', icon: Building2, label: 'Business Profile' },
      { id: 'showrooms', icon: Store, label: 'Showrooms' },
      { id: 'staff', icon: Users, label: 'Staff' },
    ]
  },
  {
    label: 'Security',
    items: [
      { id: 'access', icon: ShieldAlert, label: 'Access Control' },
      { id: 'security', icon: ShieldCheck, label: 'Security' },
    ]
  },
  {
    label: 'Communication',
    items: [
      { id: 'notifications', icon: BellRing, label: 'Notifications' },
      { id: 'email', icon: Mail, label: 'Email Config' },
    ]
  },
  {
    label: 'Commerce',
    items: [
      { id: 'payment', icon: CreditCard, label: 'Payment Gateway' },
      { id: 'logistics', icon: Truck, label: 'Logistics' },
      { id: 'tax', icon: ReceiptText, label: 'Tax & GST' },
    ]
  },
  {
    label: 'Marketing',
    items: [
      { id: 'tracking', icon: Globe, label: 'Pixels & SEO' },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'appearance', icon: Palette, label: 'Appearance' },
      { id: 'prefixes', icon: Hash, label: 'Prefix Rules' },
    ]
  },
]

const PANEL: Record<string, React.ReactNode> = {
  business: <BusinessProfile />,
  showrooms: <ShowroomManagement />,
  staff: <StaffManagement />,
  access: <AccessSettings />,
  security: <SecuritySettings />,
  notifications: <NotificationsSettings />,
  appearance: <AppearanceSettings />,
  payment: <PaymentSettings />,
  email: <EmailSettings />,
  logistics: <LogisticSettings />,
  tax: <TaxSettings />,
  prefixes: <PrefixSettings />,
  tracking: <TrackingSettings />,
}

const SettingsPage: React.FC = () => {
  const [active, setActive] = React.useState('business')
  const activeItem = NAV_GROUPS.flatMap(g => g.items).find(i => i.id === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Page header */}
      <div className="bg-card border border-border/60 rounded-2xl" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0" style={{ width: '36px', height: '36px' }}>
          <Settings2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-foreground font-bold" style={{ fontSize: '16px' }}>System Settings</h2>
          <p className="text-muted-foreground" style={{ fontSize: '12px', marginTop: '2px' }}>
            Manage your business profile, showrooms, and system configurations.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* ── Left nav ── */}
        <aside
          className="bg-card border border-border/60"
          style={{ width: '230px', flexShrink: 0, borderRadius: '20px', overflow: 'hidden', padding: '12px 10px' }}
        >
          {NAV_GROUPS.map((group, gi) => (
            <div
              key={group.label}
              style={{
                marginBottom: gi < NAV_GROUPS.length - 1 ? '16px' : '0',
              }}
            >
              {/* Group label */}
              <p
                className="text-muted-foreground font-black uppercase"
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  padding: '4px 12px 10px 12px',
                  opacity: 0.5
                }}
              >
                {group.label}
              </p>
              {/* Nav items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {group.items.map((item) => {
                  const isActive = active === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActive(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        width: '100%',
                        textAlign: 'left',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: isActive ? 'hsl(var(--primary))' : 'transparent',
                        color: isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                        cursor: 'pointer',
                        border: 'none',
                        outline: 'none',
                        boxShadow: isActive ? '0 8px 15px -5px hsl(var(--primary) / 0.4)' : 'none',
                      }}
                      className={!isActive ? 'hover:bg-muted/80 hover:pl-[14px]' : ''}
                    >
                      <item.icon style={{ width: '15px', height: '15px', flexShrink: 0, opacity: isActive ? 1 : 0.7, color: 'inherit' }} />
                      <span style={{ fontSize: '13.5px', fontWeight: isActive ? 700 : 500, color: 'inherit' }}>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* ── Content panel ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div key={active} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {PANEL[active]}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
