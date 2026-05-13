import React, { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, Package, ShoppingCart, Settings, BarChart3, Layers, ChevronRight,
  Monitor, Microscope, Tag, Globe, Upload, Bot, Image as ImageIcon, Truck, ShoppingBag,
  Database, Calculator, Phone, Calendar, Eye, Wrench, Star, Percent, Ticket, Megaphone,
  FileText, RotateCcw, RotateCw, AlertTriangle, MessageSquare, ChevronDown
} from 'lucide-react'

const navGroups = [
  {
    title: "Core",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", module: 'dashboard' },
      { icon: Monitor, label: "POS", module: 'pos' },
      { icon: Microscope, label: "POS Order", module: 'pos_order' },
      { icon: ShoppingCart, label: "Orders", module: 'orders' }
    ]
  },
  {
    title: "Catalog",
    items: [
      { icon: Tag, label: "Products", module: 'products' },
      { icon: Globe, label: "Ecommerce", module: 'ecommerce' },
      { icon: Truck, label: "Logistics & Shipping", module: 'logistics' },
      { icon: Upload, label: "Bulk Import", module: 'bulk_import' },
      { icon: Bot, label: "AI Filler", module: 'ai_filler' },
      { icon: Package, label: "Inventory", module: 'inventory' },
      { icon: ImageIcon, label: "Media Library", module: 'media' },
      { icon: Truck, label: "Stock Transfers", module: 'transfers' },
      { icon: ShoppingBag, label: "Purchases", module: 'purchase' }
    ]
  },
  {
    title: "Enterprise",
    items: [
      { icon: Database, label: "Master Data", module: 'master' },
      { icon: Calculator, label: "Accounting", module: 'accounting' },
      { icon: FileText, label: "Invoices", module: 'invoices' }
    ]
  },
  {
    title: "Returns & Shrinkage",
    items: [
      { icon: RotateCcw, label: "Customer Returns", module: 'return_customer' },
      { icon: RotateCw, label: "Vendor Returns", module: 'return_vendor' },
      { icon: AlertTriangle, label: "Damaged Goods", module: 'damaged_goods' }
    ]
  },
  {
    title: "Customers & Clinical",
    items: [
      { icon: Users, label: "Customers", module: 'customers' },
      { icon: Phone, label: "CRM & Leads", module: 'crm' },
      { icon: MessageSquare, label: "Chat Support", module: 'chat' },
      { icon: Calendar, label: "Appointments", module: 'appointments' },
      { icon: Eye, label: "Eye Tests", module: 'eyetests' },
      { icon: Wrench, label: "Repairs", module: 'repairs' },
      { icon: Star, label: "Loyalty", module: 'loyalty' }
    ]
  },
  {
    title: "Marketing",
    items: [
      { icon: Layers, label: "Website CMS", module: 'cms' },
      { icon: Globe, label: "AI Base SEO", module: 'seo' },
      { icon: Percent, label: "Offers", module: 'offers' },
      { icon: Ticket, label: "Coupons", module: 'coupons' },
      { icon: Megaphone, label: "Campaigns", module: 'campaigns' }
    ]
  },
  {
    title: "System",
    items: [
      { icon: BarChart3, label: "Reports", module: 'reports' },
      { icon: Settings, label: "Settings", module: 'settings' }
    ]
  }
]

import { useAppStore } from '@/store/useAppStore'

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, currentModule, setCurrentModule } = useAppStore()
  
  // Track expanded state map per group index
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})

  // Auto minimize behavior: automatically expand ONLY the group containing the active module
  useEffect(() => {
    const activeMap: Record<number, boolean> = {}
    navGroups.forEach((group, idx) => {
      const hasActive = group.items.some(item => item.module === currentModule)
      activeMap[idx] = hasActive
    })
    setExpandedGroups(activeMap)
  }, [currentModule])

  const toggleGroup = (idx: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  return (
    <aside
      className={cn(
        "flex-shrink-0 border-r border-sidebar-border flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-40",
        "bg-sidebar text-sidebar-foreground",
        isSidebarOpen ? "w-[240px]" : "w-[68px]"
      )}
    >
      {/* Logo Container */}
      <div
        className="flex items-center gap-3 border-b border-sidebar-border flex-shrink-0"
        style={isSidebarOpen
          ? { padding: '18px 20px' }
          : { justifyContent: 'center', padding: '18px 0' }
        }
      >
        <div className="h-9 w-9 bg-sidebar-primary rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
          <Layers className="h-5 w-5" />
        </div>
        {isSidebarOpen && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-200 min-w-0">
            <h1 className="font-bold text-base leading-none text-sidebar-foreground truncate">BlinkOpticals</h1>
            <p className="text-sidebar-foreground/40 uppercase tracking-widest mt-1.5" style={{ fontSize: '10px' }}>ERP Enterprise</p>
          </div>
        )}
      </div>

      {/* Navigation Scrollbox Tier */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: 'none', padding: '12px 0' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navGroups.map((group, groupIdx) => {
            const isGroupExpanded = !!expandedGroups[groupIdx]
            
            return (
              <div key={groupIdx} style={{ paddingLeft: isSidebarOpen ? '10px' : '6px', paddingRight: isSidebarOpen ? '10px' : '6px' }}>
                
                {/* Accordion Group Header Button */}
                {isSidebarOpen && (
                  <button
                    onClick={() => toggleGroup(groupIdx)}
                    className="w-full flex items-center justify-between text-sidebar-foreground/40 hover:text-sidebar-foreground/70 font-semibold uppercase transition-colors group"
                    style={{
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      padding: '12px 10px 6px 10px',
                      textAlign: 'left'
                    }}
                  >
                    <span className="truncate">{group.title}</span>
                    <span className="p-0.5 rounded bg-sidebar-accent/30 group-hover:bg-sidebar-accent transition-colors flex-shrink-0 ml-1">
                      {isGroupExpanded ? (
                        <ChevronDown className="h-3 w-3 opacity-80" />
                      ) : (
                        <ChevronRight className="h-3 w-3 opacity-80" />
                      )}
                    </span>
                  </button>
                )}

                {!isSidebarOpen && groupIdx > 0 && (
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 4px' }} />
                )}

                {/* Group Item Container — visible either when collapsed sidebar view OR when accordion is active */}
                {(!isSidebarOpen || isGroupExpanded) && (
                  <div className="animate-in fade-in duration-200" style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: isSidebarOpen ? '2px' : '0' }}>
                    {group.items.map((item, i) => {
                      const isActive = currentModule === item.module
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentModule(item.module)}
                          title={!isSidebarOpen ? item.label : ""}
                          style={isSidebarOpen
                            ? {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '9px 12px',
                                borderRadius: '10px',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'all 0.15s',
                                position: 'relative',
                                background: isActive ? 'rgba(var(--sidebar-primary-rgb, 101, 120, 228), 0.15)' : 'transparent',
                                color: isActive ? 'hsl(var(--sidebar-primary))' : 'rgba(255,255,255,0.55)',
                              }
                            : {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '10px 0',
                                borderRadius: '10px',
                                width: '100%',
                                position: 'relative',
                                transition: 'all 0.15s',
                                background: isActive ? 'rgba(101, 120, 228, 0.15)' : 'transparent',
                                color: isActive ? 'hsl(var(--sidebar-primary))' : 'rgba(255,255,255,0.45)',
                              }
                          }
                          className={cn(
                            "group/btn",
                            !isActive && "hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          )}
                        >
                          {!isSidebarOpen && isActive && (
                            <div
                              className="absolute bg-sidebar-primary rounded-r-full"
                              style={{ left: 0, width: '3px', height: '20px' }}
                            />
                          )}
                          <item.icon
                            style={{
                              flexShrink: 0,
                              width: isSidebarOpen ? '17px' : '19px',
                              height: isSidebarOpen ? '17px' : '19px',
                              color: isActive ? 'hsl(var(--sidebar-primary))' : 'inherit',
                            }}
                          />
                          {isSidebarOpen && (
                            <>
                              <span
                                className="flex-1 truncate"
                                style={{ fontSize: '13.5px', fontWeight: 500, letterSpacing: '-0.01em' }}
                              >
                                {item.label}
                              </span>
                              {isActive && (
                                <ChevronRight style={{ width: '13px', height: '13px', opacity: 0.4, flexShrink: 0 }} />
                              )}
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Enterprise Status Footer */}
      {isSidebarOpen && (
        <div style={{ padding: '12px', borderTop: '1px solid hsl(var(--sidebar-border))', flexShrink: 0 }}>
          <div
            className="bg-sidebar-accent border border-sidebar-border/50"
            style={{ borderRadius: '12px', padding: '14px' }}
          >
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Pro Subscription</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', marginBottom: '12px', lineHeight: 1.5 }}>
              Advanced analytics & multi-store sync
            </p>
            <button
              className="w-full bg-sidebar-primary text-white hover:opacity-90 transition-opacity"
              style={{ fontSize: '10px', fontWeight: 700, padding: '8px 0', borderRadius: '8px', letterSpacing: '0.08em' }}
            >
              UPGRADE NOW
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
