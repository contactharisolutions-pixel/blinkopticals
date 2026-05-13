import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useSettings, useUpdateSetting } from '@/hooks/useSettings'
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Save, 
  Globe, 
  BarChart3, 
  Target, 
  CheckCircle2, 
  Layers,
  Sparkles,
  Search
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export const TrackingSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()
  
  const [formData, setFormData] = React.useState({
    ga4_id: '',
    ga4_enabled: true,
    gsc_verification: '',
    meta_pixel_id: '',
    meta_enabled: true
  })

  React.useEffect(() => {
    if (settings?.marketing_pixels) {
      try {
        const val = typeof settings.marketing_pixels === 'string' 
          ? JSON.parse(settings.marketing_pixels) 
          : settings.marketing_pixels
        setFormData(prev => ({ ...prev, ...val }))
      } catch (e) {
        console.error("Failed to parse marketing pixels settings", e)
      }
    }
  }, [settings])

  const handleSave = () => {
    // Basic formatting cleanups
    const cleanData = {
      ...formData,
      ga4_id: formData.ga4_id.trim().toUpperCase(),
      meta_pixel_id: formData.meta_pixel_id.trim()
    }

    // Validate GA4 Format if provided
    if (cleanData.ga4_id && !cleanData.ga4_id.startsWith('G-')) {
      toast.warning("Google Analytics 4 Measurement IDs typically start with 'G-'")
    }

    // Validate Meta Pixel ID if provided
    if (cleanData.meta_pixel_id && !/^\d+$/.test(cleanData.meta_pixel_id)) {
      toast.warning("Meta Pixel IDs should contain numeric strings only")
    }

    updateSetting.mutate({ key: 'marketing_pixels', value: cleanData }, {
      onSuccess: () => {
        toast.success('Marketing telemetry configurations saved successfully!')
      }
    })
  }

  if (isLoading) return <Skeleton className="h-[500px] w-full rounded-2xl" />

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-10">
      {/* Top action header */}
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3 shadow-sm">
        <div>
          <p className="text-[14px] font-bold text-foreground">Pixels &amp; Analytics Integration</p>
          <p className="text-[12px] text-muted-foreground">Calibrate real-time digital marketing telemetry queues directly to client web templates.</p>
        </div>
        <Button size="sm" onClick={handleSave} className="h-9 px-4 gap-1.5 rounded-xl text-[12px] font-semibold shadow-md active:scale-95 transition-all">
          <Save className="h-3.5 w-3.5" /> Save Scripts
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main configuration settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Google Analytics 4 Block */}
          <Card className="border-none shadow-xl overflow-hidden bg-background">
            <CardHeader className="bg-blue-500/5 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Google Analytics (GA4)</CardTitle>
                  <CardDescription>Measurement ID for consumer engagement tracking.</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.ga4_enabled}
                  onCheckedChange={(v) => setFormData({...formData, ga4_enabled: v})}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black flex items-center gap-2">
                  GA4 Measurement ID
                </Label>
                <div className="relative">
                  <Input 
                    value={formData.ga4_id}
                    onChange={(e) => setFormData({...formData, ga4_id: e.target.value})}
                    placeholder="e.g. G-Q1W2E3R4T5"
                    className="rounded-xl bg-muted/40 font-mono text-sm h-11"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Fires automatic <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">page_view</code> and catalog conversion payload arrays.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. Google Search Console Verification Block */}
          <Card className="border-none shadow-xl overflow-hidden bg-background">
            <CardHeader className="bg-purple-500/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Google Search Console</CardTitle>
                  <CardDescription>Domain structural ownership index validation string.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black">
                  HTML Meta Tag Content / Site Verification String
                </Label>
                <Input 
                  value={formData.gsc_verification}
                  onChange={(e) => setFormData({...formData, gsc_verification: e.target.value})}
                  placeholder="e.g. abc123xyz456_verification_token_string"
                  className="rounded-xl bg-muted/40 font-mono text-xs h-11"
                />
                <p className="text-[11px] text-muted-foreground">
                  Paste the content snippet from your <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">&lt;meta name="google-site-verification" content="..." /&gt;</code> tag.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Meta Pixel Block */}
          <Card className="border-none shadow-xl overflow-hidden bg-background">
            <CardHeader className="bg-emerald-500/5 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Meta Pixel (Facebook)</CardTitle>
                  <CardDescription>Social attribution and cross-device conversion logging.</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.meta_enabled}
                  onCheckedChange={(v) => setFormData({...formData, meta_enabled: v})}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black">
                  Meta Pixel Dataset ID
                </Label>
                <Input 
                  value={formData.meta_pixel_id}
                  onChange={(e) => setFormData({...formData, meta_pixel_id: e.target.value})}
                  placeholder="e.g. 123456789012345"
                  className="rounded-xl bg-muted/40 font-mono text-sm h-11"
                />
                <p className="text-[11px] text-muted-foreground">
                  Fires digital tracking cues for <span className="font-bold">ViewContent</span>, <span className="font-bold">AddToCart</span>, and checkout <span className="font-bold">Purchase</span> operations.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-primary/90 text-primary-foreground overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Globe className="h-32 w-32" />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Telemetry Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[12px] leading-relaxed opacity-90">
                Injected configurations execute client-side inside standard browser boundaries. Scripts respect client privacy opt-outs and cookie confirmation parameters globally.
              </p>
              <div className="p-3 rounded-xl bg-black/10 border border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-bold">Sync Mode</span>
                <Badge className="bg-white text-primary font-bold h-5 text-[9px] border-none">Dynamic Feed</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-background">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" /> Event Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                { name: 'PageView / Screen', desc: 'Fires instantly on entry', status: 'Active' },
                { name: 'ViewContent', desc: 'Product viewing attribute sync', status: 'Enriched' },
                { name: 'AddToCart', desc: 'Shopping bag inclusion event', status: 'Calibrated' },
                { name: 'Purchase', desc: 'Reconciled transactional log', status: 'Dynamic' }
              ].map(ev => (
                <div key={ev.name} className="flex items-center justify-between text-xs pb-2 border-b last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-foreground">{ev.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ev.desc}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {ev.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
