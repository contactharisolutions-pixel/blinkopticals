import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useSettings, useUpdateSetting } from '@/hooks/useSettings'
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Save, 
  Palette, 
  Paintbrush, 
  Code, 
  Layout, 
  Type, 
  MousePointer2,
  Monitor,
  Droplets,
  Sparkles,
  LayoutGrid
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { cn } from "@/lib/utils"

export const AppearanceSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()
  
  const [formData, setFormData] = React.useState<any>({
    theme: 'auto',
    colors: {
      primary: '#000000',
      secondary: '#6366f1',
      background: '#ffffff',
      foreground: '#000000',
      muted: '#f1f5f9',
      accent: '#f1f5f9',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    layout: {
      density: 'standard',
      sidebar: 'glass',
      radius: 12,
      font: 'Inter'
    },
    custom_css: ''
  })

  React.useEffect(() => {
    if (settings?.appearance) {
      try {
        const parsed = typeof settings.appearance === 'string' ? JSON.parse(settings.appearance) : settings.appearance
        // Merge with defaults to ensure all nested keys exist
        setFormData({
          ...formData,
          ...parsed,
          colors: { ...formData.colors, ...(parsed.colors || {}) },
          layout: { ...formData.layout, ...(parsed.layout || {}) }
        })
      } catch (e) {}
    }
  }, [settings])

  const handleSave = () => {
    updateSetting.mutate({ key: 'appearance', value: formData }, {
      onSuccess: () => {
        toast.success('Appearance configuration updated successfully!')
      }
    })
    
    // Immediate CSS variable injection for live feedback
    const root = document.documentElement;
    Object.entries(formData.colors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val as string);
    });
    root.style.setProperty('--radius', `${formData.layout.radius}px`);
  }

  if (isLoading) return <Skeleton className="h-[700px] w-full rounded-2xl" />

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-10">
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3">
        <div>
          <p className="text-[14px] font-bold text-foreground">Appearance</p>
          <p className="text-[12px] text-muted-foreground">UI/UX theme, colors, typography and layout density</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[12px]" onClick={() => window.location.reload()}>Discard</Button>
          <Button size="sm" onClick={handleSave} className="h-9 px-4 gap-1.5 rounded-xl text-[12px] font-semibold">
            <Save className="h-3.5 w-3.5" /> Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Color Palette & Typography */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/50 border-b relative">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Droplets className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Dynamic Color Palette</CardTitle>
                  <CardDescription>Enterprise-level control over the system's chromatic tokens.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-8 sm:grid-cols-3">
                 {[
                   { label: 'Primary', key: 'primary', desc: 'Main theme color' },
                   { label: 'Secondary', key: 'secondary', desc: 'Accents & highlights' },
                   { label: 'Background', key: 'background', desc: 'Base surface color' },
                   { label: 'Foreground', key: 'foreground', desc: 'Main text color' },
                   { label: 'Muted', key: 'muted', desc: 'Subtle backgrounds' },
                   { label: 'Accent', key: 'accent', desc: 'Action elements' },
                   { label: 'Success', key: 'success', desc: 'Confirmation states' },
                   { label: 'Warning', key: 'warning', desc: 'Alert notifications' },
                   { label: 'Error', key: 'error', desc: 'Destructive actions' }
                 ].map(color => (
                   <div key={color.key} className="space-y-2 group">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{color.label}</Label>
                        <Badge variant="outline" className="text-[9px] font-mono border-muted px-1">{formData.colors[color.key]}</Badge>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="relative overflow-hidden w-10 h-10 rounded-xl border border-muted-foreground/10 shadow-inner">
                           <Input 
                            type="color"
                            value={formData.colors[color.key]}
                            onChange={(e) => setFormData({
                              ...formData, 
                              colors: { ...formData.colors, [color.key]: e.target.value }
                            })}
                            className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-none p-0"
                          />
                        </div>
                        <Input 
                          value={formData.colors[color.key]}
                          onChange={(e) => setFormData({
                            ...formData, 
                            colors: { ...formData.colors, [color.key]: e.target.value }
                          })}
                          className="rounded-xl bg-muted/20 border-transparent focus:bg-background transition-all h-10 font-mono text-xs"
                        />
                      </div>
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" /> Structure & Spacing
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Layout Density</Label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-xl">
                    {['Compact', 'Standard', 'Relaxed'].map(d => (
                      <Button 
                        key={d}
                        variant={formData.layout.density === d.toLowerCase() ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setFormData({
                          ...formData, 
                          layout: { ...formData.layout, density: d.toLowerCase() }
                        })}
                        className={cn(
                          "rounded-lg text-[10px] h-8 transition-all",
                          formData.layout.density === d.toLowerCase() && "shadow-sm bg-background"
                        )}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex justify-between">
                    Corner Radius <span className="text-primary">{formData.layout.radius}px</span>
                  </Label>
                  <Slider 
                    value={[formData.layout.radius]} 
                    max={24} 
                    step={2} 
                    onValueChange={([v]) => setFormData({
                      ...formData, 
                      layout: { ...formData.layout, radius: v }
                    })}
                    className="py-4"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground px-1">
                    <span>Sharp (0px)</span>
                    <span>Soft (12px)</span>
                    <span>Round (24px)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Type className="h-4 w-4 text-primary" /> Typography & Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Global Typeface</Label>
                  <Select 
                    value={formData.layout.font} 
                    onValueChange={(v) => setFormData({
                      ...formData, 
                      layout: { ...formData.layout, font: v }
                    })}
                  >
                    <SelectTrigger className="rounded-xl bg-muted/30 border-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl">
                      <SelectItem value="Inter">Inter (Swiss Classic)</SelectItem>
                      <SelectItem value="Outfit">Outfit (Brand Modern)</SelectItem>
                      <SelectItem value="Geist">Geist (Developer Sans)</SelectItem>
                      <SelectItem value="Poppins">Poppins (Friendly)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Sidebar Visual State</Label>
                  <Select 
                    value={formData.layout.sidebar} 
                    onValueChange={(v) => setFormData({
                      ...formData, 
                      layout: { ...formData.layout, sidebar: v }
                    })}
                  >
                    <SelectTrigger className="rounded-xl bg-muted/30 border-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl">
                      <SelectItem value="dark">Deep Night</SelectItem>
                      <SelectItem value="light">Pure Minimal</SelectItem>
                      <SelectItem value="glass">Glassmorphism (Frosted)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Preview & Advanced */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative min-h-[300px]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <CardHeader className="relative">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Real-time Simulator
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">Visualizing chromatic tokens</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-6 pt-4">
               <div 
                 className="p-5 rounded-2xl bg-background/5 backdrop-blur-xl border border-white/20 space-y-4 shadow-2xl"
                 style={{ borderRadius: `${formData.layout.radius}px` }}
               >
                 <div className="flex items-center gap-2">
                    <div className="h-3 w-16 bg-white/20 rounded-full animate-pulse" />
                    <div className="h-3 w-10 bg-white/10 rounded-full" />
                 </div>
                 
                 <div className="space-y-2">
                    <div className="h-10 w-full bg-white/10 rounded-xl flex items-center px-4 border border-white/5">
                      <div className="h-4 w-4 bg-white/20 rounded-lg" />
                      <div className="ml-3 h-2 w-32 bg-white/20 rounded-full" />
                    </div>
                 </div>

                 <div className="flex gap-2">
                    <div className="h-10 flex-1 bg-white rounded-xl shadow-lg flex items-center justify-center">
                       <div className="h-2 w-12 rounded-full" style={{ backgroundColor: formData.colors.primary }} />
                    </div>
                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                       <div className="h-4 w-4 rounded-full" style={{ backgroundColor: formData.colors.secondary }} />
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                     <p className="text-[8px] uppercase font-bold text-white/50 tracking-widest">Active Font</p>
                     <p className="text-xs font-bold truncate">{formData.layout.font}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                     <p className="text-[8px] uppercase font-bold text-white/50 tracking-widest">Sidebar</p>
                     <p className="text-xs font-bold truncate capitalize">{formData.layout.sidebar}</p>
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <Code className="h-4 w-4" /> Global CSS Overrides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={formData.custom_css}
                onChange={(e) => setFormData({...formData, custom_css: e.target.value})}
                className="w-full h-56 p-4 rounded-xl bg-muted/20 border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-[10px] leading-relaxed"
                placeholder="/* Root variable overrides */&#10;:root {&#10;  --primary-glow: rgba(...);&#10;}&#10;&#10;.glass { backdrop-filter: blur(20px); }"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
