import React from 'react'
import { Store, ChevronDown, MapPin } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import axios from 'axios'

export const ShowroomSelector: React.FC = () => {
  const { currentShowroom, setCurrentShowroom } = useAppStore()
  const [showrooms, setShowrooms] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchShowrooms = async () => {
      try {
        const res = await axios.get('/api/showrooms?business_id=biz_blink_001')
        if (res.data.success) {
          setShowrooms(res.data.data)
          
          // Initial Sync: Use saved value from sessionStorage if available
          const saved = sessionStorage.getItem('global_showroom');
          if (saved && res.data.data.find((s: any) => s.showroom_id === saved)) {
            setCurrentShowroom(saved);
          } else if (!currentShowroom && res.data.data.length > 0) {
            setCurrentShowroom(res.data.data[0].showroom_id)
          }
        }
      } catch (err) {
        console.error('Failed to fetch showrooms', err)
      } finally {
        setLoading(false)
      }
    }
    fetchShowrooms()
  }, [])

  // Sync with iframes whenever currentShowroom changes
  React.useEffect(() => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({
        type: 'SYNC_SHOWROOM',
        showroom_id: currentShowroom
      }, '*');
    });
  }, [currentShowroom])

  const selectedShowroom = showrooms.find(s => s.showroom_id === currentShowroom)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-all border border-border/20 bg-muted/10 group">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Store className="h-3.5 w-3.5" />
          </div>
          <div className="text-left hidden lg:block leading-tight">
            <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-tighter mb-0.5">Active Showroom</p>
            <p className="text-[12px] font-bold text-foreground truncate max-w-[100px]">
              {loading ? '...' : selectedShowroom?.showroom_name || 'Global'}
            </p>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground transition-colors ml-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" sideOffset={8} className="w-64 rounded-2xl shadow-2xl border-border/40 p-2">
        <DropdownMenuLabel className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-3 py-2">
          Switch Location
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40" />
        
        <DropdownMenuItem 
          onClick={() => setCurrentShowroom(null)}
          className="rounded-xl text-[13px] font-semibold cursor-pointer px-3 py-2.5 my-1 focus:bg-primary/5 focus:text-primary transition-colors flex items-center gap-2"
        >
          <MapPin className="h-4 w-4 opacity-40" />
          All Showrooms (Global)
        </DropdownMenuItem>

        {showrooms.map((s) => (
          <DropdownMenuItem
            key={s.showroom_id}
            onClick={() => setCurrentShowroom(s.showroom_id)}
            className={`rounded-xl text-[13px] font-semibold cursor-pointer px-3 py-2.5 my-1 transition-colors flex items-center gap-2 ${
              currentShowroom === s.showroom_id ? 'bg-primary/10 text-primary' : 'focus:bg-primary/5 focus:text-primary'
            }`}
          >
            <Store className="h-4 w-4 opacity-40" />
            <div className="flex-1">
              <p className="font-bold">{s.showroom_name}</p>
              <p className="text-[10px] opacity-60 font-medium">{s.city || 'Store Location'}</p>
            </div>
            {currentShowroom === s.showroom_id && (
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
