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
  Mail, 
  Server, 
  Wifi, 
  WifiOff, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  Send,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { cn } from "@/lib/utils"

export const EmailSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()
  
  const [formData, setFormData] = React.useState<any>({
    smtp_server: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    use_tls: true
  })

  const [connectionStatus, setConnectionStatus] = React.useState<'idle' | 'checking' | 'connected' | 'error'>('idle')

  React.useEffect(() => {
    if (settings?.email_sender) {
      try {
        setFormData(typeof settings.email_sender === 'string' ? JSON.parse(settings.email_sender) : settings.email_sender)
      } catch (e) {}
    }
  }, [settings])

  const handleSave = () => {
    updateSetting.mutate({ key: 'email_sender', value: formData }, {
      onSuccess: () => {
        toast.success('Email configuration saved successfully!')
      }
    })
  }

  const checkConnection = async () => {
    if (!formData.smtp_server || !formData.smtp_user || !formData.smtp_password) {
      return toast.error('Please fill in SMTP server, username, and password')
    }

    setConnectionStatus('checking')
    try {
      const response = await axios.post('/api/email/verify-smtp', formData)
      
      if (response.data.success) {
        setConnectionStatus('connected')
        toast.success(response.data.message)
      } else {
        setConnectionStatus('error')
        toast.error('Connection failed')
      }
    } catch (error: any) {
      setConnectionStatus('error')
      toast.error(error.response?.data?.error || 'SMTP server unreachable or authentication failed')
    }
  }

  if (isLoading) return <Skeleton className="h-[500px] w-full rounded-2xl" />

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-10">
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3">
        <div>
          <p className="text-[14px] font-bold text-foreground">Email Configuration</p>
          <p className="text-[12px] text-muted-foreground">Configure SMTP for receipts, resets, and notifications</p>
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
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">SMTP Relay Settings</CardTitle>
                  <CardDescription>Outgoing mail server credentials.</CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' && (
                   <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 px-3 py-1">
                      <CheckCircle2 className="h-3 w-3" /> Handshake OK
                   </Badge>
                )}
                {connectionStatus === 'error' && (
                   <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 px-3 py-1">
                      <XCircle className="h-3 w-3" /> Connection Failed
                   </Badge>
                )}
                {connectionStatus === 'checking' && (
                   <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 px-3 py-1 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" /> Authenticating...
                   </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-8 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black">SMTP Host</Label>
                  <Input 
                    value={formData.smtp_server}
                    onChange={(e) => setFormData({...formData, smtp_server: e.target.value})}
                    className="rounded-xl bg-muted/30 border-transparent focus:bg-background h-12 font-mono text-xs"
                    placeholder="e.g. smtp.gmail.com"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black">Port</Label>
                  <Input 
                    value={formData.smtp_port}
                    onChange={(e) => setFormData({...formData, smtp_port: e.target.value})}
                    className="rounded-xl bg-muted/30 border-transparent focus:bg-background h-12 font-mono text-xs"
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black">Username / Email</Label>
                  <Input 
                    value={formData.smtp_user}
                    onChange={(e) => setFormData({...formData, smtp_user: e.target.value})}
                    className="rounded-xl bg-muted/30 border-transparent focus:bg-background h-12 font-mono text-xs"
                    placeholder="yourname@domain.com"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black">Password / App Key</Label>
                  <Input 
                    type="password"
                    value={formData.smtp_password}
                    onChange={(e) => setFormData({...formData, smtp_password: e.target.value})}
                    className="rounded-xl bg-muted/30 border-transparent focus:bg-background h-12 font-mono text-xs"
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 border-t pt-8">
                 <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black">Sender Email (From)</Label>
                    <Input 
                      value={formData.from_email}
                      onChange={(e) => setFormData({...formData, from_email: e.target.value})}
                      className="rounded-xl bg-muted/30 border-transparent focus:bg-background h-12 font-mono text-xs"
                      placeholder="no-reply@blinkopticals.com"
                    />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-black">Sender Display Name</Label>
                    <Input 
                      value={formData.from_name}
                      onChange={(e) => setFormData({...formData, from_name: e.target.value})}
                      className="rounded-xl bg-muted/30 border-transparent focus:bg-background h-12 font-mono text-xs"
                      placeholder="BlinkOpticals Support"
                    />
                 </div>
              </div>

              <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/5 transition-all">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold flex items-center gap-2">
                       <ShieldCheck className="h-4 w-4 text-primary" /> SSL / TLS Encryption
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Always recommended for secure transactional emails.</p>
                  </div>
                  <Switch 
                    checked={formData.use_tls}
                    onCheckedChange={(v) => setFormData({...formData, use_tls: v})}
                  />
              </div>

              <div className="flex items-center gap-4 pt-4">
                 <Button 
                   variant="secondary" 
                   onClick={checkConnection}
                   disabled={connectionStatus === 'checking'}
                   className="rounded-xl h-12 px-8 font-bold gap-2 active:scale-95 transition-all shadow-sm"
                 >
                   {connectionStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-amber-500" />}
                   Test SMTP Handshake
                 </Button>
                 <p className="text-[10px] text-muted-foreground italic flex items-center gap-2">
                    <Send className="h-3 w-3" /> Sends a test signal to the mail server.
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
             <CardHeader>
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <Mail className="h-4 w-4" /> Mailer Intelligence
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-[11px] leading-relaxed opacity-80">
                  We use an advanced <strong>Queueing System</strong>. Even if your SMTP server is momentarily down, 
                  emails are retried automatically until delivered.
                </p>
                <div className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
                   <span className="text-[10px] font-bold">Queue Health</span>
                   <Badge className="bg-emerald-500 text-white h-4 text-[8px] border-none">Excellent</Badge>
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <WifiOff className="h-4 w-4" /> Common Hosts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                 {[
                   { name: 'Gmail', host: 'smtp.gmail.com', port: '587' },
                   { name: 'Outlook', host: 'smtp.office365.com', port: '587' },
                   { name: 'SendGrid', host: 'smtp.sendgrid.net', port: '587' }
                 ].map(h => (
                   <div key={h.name} className="p-3 rounded-xl bg-muted/20 flex items-center justify-between group hover:bg-muted/40 transition-all cursor-pointer" onClick={() => setFormData({...formData, smtp_server: h.host, smtp_port: h.port})}>
                      <div>
                        <p className="text-[11px] font-bold">{h.name}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">{h.host}</p>
                      </div>
                      <div className="p-1 rounded-md bg-background opacity-0 group-hover:opacity-100 transition-opacity">
                         <Zap className="h-3 w-3 text-primary" />
                      </div>
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
