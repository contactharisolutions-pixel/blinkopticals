import React from 'react'
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  ChevronDown
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShowroomSelector } from './ShowroomSelector'

export const Header: React.FC = () => {
  const { toggleSidebar, currentModule } = useAppStore()
  const { user } = useAuthStore()
  const [isDark, setIsDark] = React.useState(false)

  const toggleDark = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const moduleName = currentModule
    ? currentModule.charAt(0).toUpperCase() + currentModule.slice(1).replace(/_/g, ' ')
    : 'Dashboard'

  return (
    <header 
      className="h-16 border-b border-border/60 bg-background/95 backdrop-blur-md flex items-center justify-between px-10 sticky top-0 z-[50] flex-shrink-0 gap-6"
    >
      
      {/* Left: toggle + breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-9 rounded-xl hover:bg-muted flex-shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-60">
          <span>Admin</span>
          <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
          <span className="text-foreground font-black opacity-100">{moduleName}</span>
        </div>
        
        <div className="h-6 w-px bg-border/40 mx-1 hidden sm:block" />
        <ShowroomSelector />
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-lg hidden md:block">
        <div
          className="group"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'hsl(var(--muted) / 0.5)',
            border: '1px solid hsl(var(--border) / 0.4)',
            borderRadius: '12px',
            transition: 'all 0.15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = 'hsl(var(--background))'
            e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)'
            e.currentTarget.style.boxShadow = '0 0 0 4px hsl(var(--primary) / 0.08)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)'
            e.currentTarget.style.borderColor = 'hsl(var(--border) / 0.4)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {/* Icon */}
          <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '14px', flexShrink: 0 }}>
            <Search style={{ width: '15px', height: '15px', color: 'hsl(var(--muted-foreground) / 0.6)' }} />
          </span>
          {/* Input */}
          <input
            type="text"
            placeholder="Search anything…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '10px 12px',
              fontSize: '13.5px',
              fontWeight: 500,
              color: 'hsl(var(--foreground))',
              fontFamily: 'inherit',
            }}
            className="placeholder:text-muted-foreground/40"
          />
          {/* Kbd badge */}
          <kbd style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: '10px',
            fontSize: '10px',
            color: 'hsl(var(--muted-foreground) / 0.4)',
            background: 'hsl(var(--muted) / 0.8)',
            padding: '3px 7px',
            borderRadius: '6px',
            border: '1px solid hsl(var(--border) / 0.4)',
            fontFamily: 'monospace',
            flexShrink: 0,
            lineHeight: 1.4,
          }}>
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDark}
          className="h-9 w-9 rounded-xl hover:bg-muted"
        >
          {isDark
            ? <Sun className="h-4.5 w-4.5" />
            : <Moon className="h-4.5 w-4.5" />
          }
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-muted relative"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full ring-2 ring-background" />
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-xl hover:bg-muted transition-colors group">
              <Avatar className="h-8 w-8 ring-2 ring-primary/10 ring-offset-2 ring-offset-background transition-all group-hover:ring-primary/30 shadow-sm">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-[12px] font-black">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-[13px] font-bold leading-none text-foreground">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter opacity-60">
                  {user?.role || 'Super Administrator'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl border-border/40 p-2 mt-2">
            <DropdownMenuLabel className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-3 py-2">
              My Workspace
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuItem className="rounded-xl text-[13px] font-semibold cursor-pointer px-3 py-2.5 my-1 focus:bg-primary/5 focus:text-primary transition-colors">
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl text-[13px] font-semibold cursor-pointer px-3 py-2.5 my-1 focus:bg-primary/5 focus:text-primary transition-colors">
              System Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuItem
              className="rounded-xl text-[13px] font-bold text-destructive focus:text-white focus:bg-destructive cursor-pointer px-3 py-2.5 my-1 transition-all"
              onClick={() => { document.cookie = 'token=; Max-Age=0'; sessionStorage.removeItem('erp_user'); window.location.href = '/admin/login/' }}
            >
              Sign Out Securely
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
