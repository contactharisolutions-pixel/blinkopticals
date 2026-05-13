import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings, useUpdateSetting } from '@/hooks/useSettings'
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Save, 
  Truck, 
  Map, 
  Box, 
  Wifi, 
  WifiOff, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  PackageCheck,
  Navigation,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { cn } from "@/lib/utils"

export const LogisticSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()
  
  const [formData, setFormData] = React.useState<any>({
    partner: 'delhivery',
    api_key: '',
    flat_rate: '50',
    free_shipping_threshold: '1000',
    auto_assign: true,
    tracking_enabled: true
  })

  const [connectionStatus, setConnectionStatus] = React.useState<'idle' | 'checking' | 'connected' | 'error'>('idle')

  React.useEffect(() => {
    if (settings?.logistics) {
      try {
        setFormData(typeof settings.logistics === 'string' ? JSON.parse(settings.logistics) : settings.logistics)
      } catch (e) {}
    }
  }, [settings])

  const handleSave = () => {
    updateSetting.mutate({ key: 'logistics', value: formData }, {
      onSuccess: () => {
        toast.success('Logistics configuration saved successfully!')
      }
    })
  }

  const checkConnection = async () => {
    if (!formData.api_key) {
      return toast.error('Please enter Courier API Key first')
    }

    setConnectionStatus('checking')
    try {
      const response = await axios.post('/api/logistics/verify-partner', {
        partner: formData.partner,
        api_key: formData.api_key
      })
      
      if (response.data.success) {
        setConnectionStatus('connected')
        toast.success(response.data.message)
      } else {
        setConnectionStatus('error')
        toast.error('Logistics verification failed')
      }
    } catch (error: any) {
      setConnectionStatus('error')
      toast.error(error.response?.data?.error || 'Logistics service unreachable')
    }
  }

  if (isLoading) return <Skeleton className="h-[500px] w-full rounded-2xl" />

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-10">
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3">
        <div>
          <p className="text-[14px] font-bold text-foreground">Shipping & Logistics</p>
          <p className="text-[12px] text-muted-foreground">Manage courier integrations and delivery zone rules</p>
        </div>
        <Button size="sm" onClick={handleSave} className="h-9 px-4 gap-1.5 rounded-xl text-[12px] font-semibold">
          <Save className="h-3.5 w-3.5" /> Save Configuration
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background shadow-sm">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Courier Integration</CardTitle>
                  <CardDescription>Direct API link with shipping providers.</CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' && (
                   <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 px-3 py-1">
                      <CheckCircle2 className="h-3 w-3" /> API Linked
                   </Badge>
                )}
                {connectionStatus === 'error' && (
                   <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 px-3 py-1">
                      <XCircle className="h-3 w-3" /> Connection Error
                   </Badge>
                )}
                {connectionStatus === 'checking' && (
                   <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 px-3 py-1 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" /> Pinging...
                   </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black">Primary Logistics Partner</Label>
                  <Select 
                    value={formData.partner} 
                    onValueChange={(v) => setFormData({...formData, partner: v})}
                  >
                    <SelectTrigger className="w-full rounded-xl bg-muted/30 border-transparent h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="delhivery">Delhivery (India Top)</SelectItem>
                      <SelectItem value="bluedart">BlueDart (Premium)</SelectItem>
                      <SelectItem value="fedex">FedEx (International)</SelectItem>
                      <SelectItem value="self">Self-Managed (Local)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> API Key / Token
                  </Label>
                  <Input 
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                    className="rounded-xl bg-muted/30 border-transparent focus:bg-background h-12 font-mono text-xs"
                    placeholder="Enter partner secret key..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                 <Button 
                   variant="secondary" 
                   onClick={checkConnection}
                   disabled={connectionStatus === 'checking'}
                   className="rounded-xl h-12 px-8 font-bold gap-2 active:scale-95 transition-all shadow-sm"
                 >
                   {connectionStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 text-blue-500" />}
                   Test API Handshake
                 </Button>
                 <div className="flex-1 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-blue-500/20">
                       <Globe className="h-3 w-3 text-blue-600" />
                    </div>
                    <p className="text-[10px] text-blue-700 leading-tight">
                      Verifying connection with <strong>{formData.partner}</strong> servers for automated waybill generation.
                    </p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl overflow-hidden bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <PackageCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Shipping Rate Engine</CardTitle>
                  <CardDescription>Define flat rates and free delivery thresholds.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3 group">
                   <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black group-hover:text-primary transition-colors">Base Shipping Flat Rate</Label>
                   <div className="relative">
                      <span className="absolute left-4 top-3.5 text-muted-foreground font-bold">₹</span>
                      <Input 
                        type="number"
                        value={formData.flat_rate}
                        onChange={(e) => setFormData({...formData, flat_rate: e.target.value})}
                        className="rounded-xl bg-background border-muted h-12 pl-10 font-bold text-lg"
                      />
                   </div>
                </div>

                <div className="space-y-3 group">
                   <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black group-hover:text-primary transition-colors">Free Shipping Threshold</Label>
                   <div className="relative">
                      <span className="absolute left-4 top-3.5 text-muted-foreground font-bold">₹</span>
                      <Input 
                        type="number"
                        value={formData.free_shipping_threshold}
                        onChange={(e) => setFormData({...formData, free_shipping_threshold: e.target.value})}
                        className="rounded-xl bg-background border-muted h-12 pl-10 font-bold text-lg"
                      />
                   </div>
                   <p className="text-[10px] text-muted-foreground italic">Orders above this value will have zero shipping cost.</p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 border-t pt-8">
                 <div className="flex items-center justify-between p-5 rounded-2xl bg-background border border-border/50 shadow-sm">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <Box className="h-4 w-4 text-emerald-500" /> Auto-Assign AWB
                      </Label>
                      <p className="text-[10px] text-muted-foreground">Auto-generate waybills on packing.</p>
                    </div>
                    <Switch 
                      checked={formData.auto_assign}
                      onCheckedChange={(v) => setFormData({...formData, auto_assign: v})}
                    />
                 </div>

                 <div className="flex items-center justify-between p-5 rounded-2xl bg-background border border-border/50 shadow-sm">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <Map className="h-4 w-4 text-emerald-500" /> Live Tracking
                      </Label>
                      <p className="text-[10px] text-muted-foreground">Sync tracking info with customer emails.</p>
                    </div>
                    <Switch 
                      checked={formData.tracking_enabled}
                      onCheckedChange={(v) => setFormData({...formData, tracking_enabled: v})}
                    />
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-xl bg-primary text-primary-foreground overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <Truck className="h-20 w-20" />
             </div>
             <CardHeader>
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <ShieldCheck className="h-4 w-4" /> Logistics Guard
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-[11px] leading-relaxed opacity-80">
                  We use an <strong>Intelligent Routing Engine</strong>. If your primary partner is down, the system 
                  can automatically switch to secondary carriers.
                </p>
                <div className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
                   <span className="text-[10px] font-bold">API Integrity</span>
                   <Badge className="bg-white text-primary h-4 text-[8px] border-none">Verified</Badge>
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <WifiOff className="h-4 w-4" /> Partner Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
               <div className="space-y-2">
                  {[
                    { name: 'Delhivery', area: 'Pan-India', type: 'Surface/Express' },
                    { name: 'BlueDart', area: 'Global', type: 'Premium' },
                    { name: 'FedEx', area: 'International', type: 'Global Relay' }
                  ].map(p => (
                    <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-all">
                       <div>
                         <p className="text-[11px] font-bold">{p.name}</p>
                         <p className="text-[9px] text-muted-foreground">{p.area}</p>
                       </div>
                       <Badge variant="outline" className="text-[8px] border-primary/20 text-primary">{p.type}</Badge>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
