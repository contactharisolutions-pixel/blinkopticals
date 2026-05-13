import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useMedia, MediaItem } from '@/hooks/useMedia'
import { Skeleton } from "@/components/ui/skeleton"
import { Image as ImageIcon, Upload, Search, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaSelectorProps {
  businessId: string
  onSelect: (url: string) => void
  currentValue?: string
}

export const MediaSelector: React.FC<MediaSelectorProps> = ({ 
  businessId, 
  onSelect, 
  currentValue 
}) => {
  const [open, setOpen] = React.useState(false)
  const { data: media, isLoading } = useMedia(businessId)
  const [selectedUrl, setSelectedUrl] = React.useState(currentValue || '')

  const handleSelect = (url: string) => {
    setSelectedUrl(url)
    onSelect(url)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="group relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 transition-all hover:border-primary/50 hover:bg-muted/50">
          {currentValue ? (
            <img 
              src={currentValue} 
              alt="Preview" 
              className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105" 
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <ImageIcon className="h-6 w-6" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Select Logo</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Change</span>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] gap-0 p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <DialogHeader className="p-6 border-b bg-card">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold tracking-tight">Media Library</DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Upload New
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              placeholder="Search assets..." 
              className="w-full bg-muted/50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </DialogHeader>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-6 max-h-[400px] overflow-y-auto bg-muted/10">
          {isLoading ? (
            Array(10).fill(0).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))
          ) : (
            media?.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleSelect(item.file_url)}
                className={cn(
                  "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition-all hover:scale-105",
                  selectedUrl === item.file_url 
                    ? "border-primary ring-2 ring-primary/20 shadow-lg" 
                    : "border-transparent bg-card"
                )}
              >
                <img 
                  src={item.thumbnail_url || item.file_url} 
                  alt={item.file_name} 
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <p className="text-[10px] text-white font-medium truncate">{item.file_name}</p>
                </div>
                {selectedUrl === item.file_url && (
                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))
          )}
          {media?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">No assets found</p>
              <p className="text-xs">Upload your first image to get started</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-card flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
