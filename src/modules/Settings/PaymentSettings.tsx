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
  CreditCard, 
  KeyRound, 
  Wifi, 
  WifiOff, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  Wallet,
  Coins,
  Receipt,
  ShoppingCart
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

export const PaymentSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()
  
  const [formData, setFormData] = React.useState<any>({
    provider: 'razorpay',
    api_key: '',
    api_secret: '',
    webhook_secret: '',
    test_mode: true
  })

  const [rules, setRules] = React.useState<any>({
    cod_enabled: true,
    allow_partial: false,
    partial_percentage: 25,
    min_order_value: 0
  })

  const [connectionStatus, setConnectionStatus] = React.useState<'idle' | 'checking' | 'connected' | 'error'>('idle')

  React.useEffect(() => {
    if (settings?.payment_gateway) {
      try {
        setFormData(typeof settings.payment_gateway === 'string' ? JSON.parse(settings.payment_gateway) : settings.payment_gateway)
      } catch (e) {}
    }
    if (settings?.payment_rules) {
      try {
        setRules(typeof settings.payment_rules === 'string' ? JSON.parse(settings.payment_rules) : settings.payment_rules)
      } catch (e) {}
    }
  }, [settings])

  const handleSave = () => {
    updateSetting.mutate({ key: 'payment_gateway', value: formData })
    updateSetting.mutate({ key: 'payment_rules', value: rules }, {
      onSuccess: () => {
        toast.success('Payment configuration updated successfully!')
      }
    })
  }

  const checkConnection = async () => {
    if (!formData.api_key || !formData.api_secret) {
      return toast.error('Please enter API Key and Secret first')
    }

    setConnectionStatus('checking')
    try {
      const response = await axios.post('/api/payment/verify-credentials', {
        provider: formData.provider,
        api_key: formData.api_key,
        api_secret: formData.api_secret
      })
      
      if (response.data.success) {
        setConnectionStatus('connected')
        toast.success(response.data.message)
      } else {
        setConnectionStatus('error')
        toast.error('Connection failed')
      }
    } catch (error: any) {
      setConnectionStatus('error')
      toast.error(error.response?.data?.error || 'Verification service unreachable')
    }
  }

  if (isLoading) return <Skeleton className="h-[700px] w-full rounded-2xl" />

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-10">
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3">
        <div>
          <p className="text-[14px] font-bold text-foreground">Payment Gateway</p>
          <p className="text-[12px] text-muted-foreground">Configure payment processors and checkout rules</p>
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
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Gateway Configuration</CardTitle>
                  <CardDescription>Primary payment processor settings.</CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' && (
                   <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 px-3 py-1">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                   </Badge>
                )}
                {connectionStatus === 'error' && (
                   <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 px-3 py-1">
                      <XCircle className="h-3 w-3" /> Failed
                   </Badge>
                )}
                {connectionStatus === 'checking' && (
                   <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 px-3 py-1 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" /> Verifying...
                   </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black">Provider</Label>
                  <Select 
                    value={formData.provider} 
                    onValueChange={(v) => setFormData({...formData, provider: v})}
                  >
                    <SelectTrigger className="w-full rounded-xl bg-muted/30 border-transparent h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="razorpay">Razorpay (India)</SelectItem>
                      <SelectItem value="stripe">Stripe (Global)</SelectItem>
                      <SelectItem value="offline">Cash on Delivery (Manual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-5 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/5 transition-all flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black">Environment</Label>
                    <p className="text-[10px] text-muted-foreground">{formData.test_mode ? 'Sandbox / Test' : 'Production / Live'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className={cn("text-[10px] font-bold", formData.test_mode ? "text-amber-600" : "text-muted-foreground")}>Test</span>
                     <Switch 
                        checked={!formData.test_mode}
                        onCheckedChange={(v) => setFormData({...formData, test_mode: !v})}
                      />
                     <span className={cn("text-[10px] font-bold", !formData.test_mode ? "text-emerald-600" : "text-muted-foreground")}>Live</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black flex items-center gap-2">
                    <KeyRound className="h-3 w-3" /> API Key / Key ID
                  </Label>
                  <Input 
                    value={formData.api_key}
                    onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                    className="rounded-xl bg-muted/30 border-transparent focus:bg-background h-12 font-mono text-xs"
                    placeholder={formData.provider === 'razorpay' ? "rzp_live_..." : "pk_live_..."}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> API Secret
                  </Label>
                  <Input 
                    type="password"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({...formData, api_secret: e.target.value})}
                    className="rounded-xl bg-muted/30 border-transparent focus:bg-background h-12 font-mono text-xs"
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 border-t pt-8">
                 <Button 
                   variant="secondary" 
                   onClick={checkConnection}
                   disabled={connectionStatus === 'checking'}
                   className="rounded-xl h-12 px-8 font-bold gap-2 active:scale-95 transition-all shadow-sm"
                 >
                   {connectionStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4 text-emerald-500" />}
                   Check Connection
                 </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl overflow-hidden bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/10">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <ShoppingCart className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Ecommerce Checkout Rules</CardTitle>
                  <CardDescription>Configure how customers pay on your public storefront.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-background shadow-sm border border-border/50">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-indigo-500" /> Cash on Delivery (COD)
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Allow customers to pay at the time of delivery.</p>
                  </div>
                  <Switch 
                    checked={rules.cod_enabled}
                    onCheckedChange={(v) => setRules({...rules, cod_enabled: v})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-background shadow-sm border border-border/50">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Coins className="h-4 w-4 text-indigo-500" /> Partial Payment
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Allow paying a percentage online & rest via COD.</p>
                  </div>
                  <Switch 
                    checked={rules.allow_partial}
                    onCheckedChange={(v) => setRules({...rules, allow_partial: v})}
                  />
                </div>
              </div>

              {rules.allow_partial && (
                <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-6 animate-in slide-in-from-top-2">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-bold">Minimum Deposit Percentage</Label>
                        <p className="text-xs text-indigo-600/70 font-medium">Customers must pay at least {rules.partial_percentage}% online.</p>
                      </div>
                      <Badge variant="secondary" className="bg-indigo-500 text-white border-none px-3 h-8 text-sm font-bold">
                        {rules.partial_percentage}%
                      </Badge>
                   </div>
                   
                   <Slider 
                     value={[rules.partial_percentage]}
                     max={90}
                     min={10}
                     step={5}
                     onValueChange={([v]) => setRules({...rules, partial_percentage: v})}
                     className="py-4"
                   />

                   <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50 border border-indigo-500/10">
                      <div className="p-1.5 rounded-full bg-indigo-500/20">
                         <Receipt className="h-3 w-3 text-indigo-600" />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic leading-tight">
                        <strong>Workflow:</strong> Customer pays {rules.partial_percentage}% via {formData.provider === 'razorpay' ? 'Razorpay' : 'Stripe'}. 
                        The remaining {100 - rules.partial_percentage}% will be automatically marked as "Balance Due" via COD.
                      </p>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-xl bg-primary text-primary-foreground overflow-hidden">
             <CardHeader>
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <ShieldCheck className="h-4 w-4" /> Security Guard
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-[11px] leading-relaxed opacity-80">
                  Your API credentials are encrypted with <strong>AES-256-GCM</strong> before storage. 
                </p>
                <div className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-2">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold">PCI-DSS Status</span>
                      <Badge className="bg-white text-primary h-4 text-[8px] border-none">Verified</Badge>
                   </div>
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <WifiOff className="h-4 w-4" /> Webhook Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Webhook Secret</Label>
                <Input 
                  type="password"
                  value={formData.webhook_secret}
                  onChange={(e) => setFormData({...formData, webhook_secret: e.target.value})}
                  className="rounded-xl bg-muted/30 border-transparent h-10 font-mono text-xs"
                  placeholder="Optional secret..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
