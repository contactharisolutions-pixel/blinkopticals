import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings, useUpdateSetting } from '@/hooks/useSettings'
import { Skeleton } from "@/components/ui/skeleton"
import { 
  BellRing, 
  Mail, 
  MessageSquare, 
  Phone, 
  Save, 
  Plus,
  Trash2,
  FileCode,
  Globe,
  Variable,
  Settings2,
  Zap,
  Play,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { cn } from "@/lib/utils"

export const NotificationsSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()
  
  const [channels, setChannels] = React.useState<any>({
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    order_updates: true,
    stock_alerts: true
  })

  const [gateways, setGateways] = React.useState<any>({
    smtp_host: '',
    smtp_user: '',
    smtp_pass: '',
    sms_api_key: '',
    whatsapp_token: '',
    whatsapp_phone_id: ''
  })

  const [templates, setTemplates] = React.useState<any[]>([
    { id: 1, name: 'Order Confirmation', channel: 'Email', content: 'Hello {{customer_name}}, your order #{{order_id}} is confirmed!' },
    { id: 2, name: 'Order Dispatched', channel: 'WhatsApp', content: 'Great news! Your order {{order_id}} is on its way.' }
  ])

  const [automations, setAutomations] = React.useState<any[]>([
    { id: 1, event: 'Order Placed', action: 'WhatsApp', template: 'Order Confirmation', delay: 'Instant', active: true },
    { id: 2, event: 'Low Stock', action: 'Email', template: 'Manager Alert', delay: 'Instant', active: true },
  ])

  const [newTemplate, setNewTemplate] = React.useState({ name: '', channel: 'Email', content: '' })

  React.useEffect(() => {
    if (settings?.notification_channels) {
      try {
        setChannels(typeof settings.notification_channels === 'string' ? JSON.parse(settings.notification_channels) : settings.notification_channels)
      } catch (e) {}
    }
    if (settings?.communication_gateways) {
      try {
        setGateways(typeof settings.communication_gateways === 'string' ? JSON.parse(settings.communication_gateways) : settings.communication_gateways)
      } catch (e) {}
    }
  }, [settings])

  const handleSave = () => {
    updateSetting.mutate({ key: 'notification_channels', value: channels })
    updateSetting.mutate({ key: 'communication_gateways', value: gateways }, {
      onSuccess: () => toast.success('Notification settings saved successfully!')
    })
  }

  const addTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) return toast.error('Template name and content required')
    setTemplates([...templates, { ...newTemplate, id: Date.now() }])
    setNewTemplate({ name: '', channel: 'Email', content: '' })
    toast.success('Template added locally (ready to save)')
  }

  if (isLoading) return <Skeleton className="h-[500px] w-full" />

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-10">
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3">
        <div>
          <p className="text-[14px] font-bold text-foreground">Notifications & Communication</p>
          <p className="text-[12px] text-muted-foreground">Channels, gateways, message templates and automations</p>
        </div>
        <Button size="sm" onClick={handleSave} className="h-9 px-4 gap-1.5 rounded-xl text-[12px] font-semibold">
          <Save className="h-3.5 w-3.5" /> Save All
        </Button>
      </div>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl h-11">
          <TabsTrigger value="channels" className="rounded-lg gap-2 px-6"><BellRing className="h-3.5 w-3.5" /> Channels</TabsTrigger>
          <TabsTrigger value="gateways" className="rounded-lg gap-2 px-6"><Globe className="h-3.5 w-3.5" /> API & Gateways</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg gap-2 px-6"><FileCode className="h-3.5 w-3.5" /> Message Templates</TabsTrigger>
          <TabsTrigger value="automations" className="rounded-lg gap-2 px-6"><Zap className="h-3.5 w-3.5 text-amber-500" /> Automations</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Settings2 className="h-4 w-4" /> Active Channels
                </CardTitle>
                <CardDescription>Enable or disable communication methods.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'email_enabled', label: 'Email Notifications', icon: Mail, desc: 'Send receipts and order status via email.' },
                  { id: 'sms_enabled', label: 'SMS Alerts', icon: Phone, desc: 'Transactional SMS for OTPs and critical alerts.' },
                  { id: 'whatsapp_enabled', label: 'WhatsApp API', icon: MessageSquare, desc: 'Send automated updates to WhatsApp.' }
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-transparent hover:border-primary/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background shadow-sm">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold">{item.label}</Label>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={channels[item.id]} 
                      onCheckedChange={(c) => setChannels({...channels, [item.id]: c})} 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-500">
                  <BellRing className="h-4 w-4" /> Automation Triggers
                </CardTitle>
                <CardDescription>What events should trigger notifications?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {[
                  { id: 'order_updates', label: 'Order Lifecycle', desc: 'Notify on Confirmation, Dispatch, and Delivery.' },
                  { id: 'stock_alerts', label: 'Low Stock Warnings', desc: 'Alert managers when inventory hits threshold.' }
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <Label className="text-xs font-bold">{item.label}</Label>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch 
                      checked={channels[item.id]} 
                      onCheckedChange={(c) => setChannels({...channels, [item.id]: c})} 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gateways">
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Provider Credentials
              </CardTitle>
              <CardDescription>Connect your BlinkOpticals account to messaging providers.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3 w-3" /> SMTP (Email)
                  </h4>
                  <Input 
                    placeholder="Host (e.g. smtp.gmail.com)" 
                    value={gateways.smtp_host}
                    onChange={e => setGateways({...gateways, smtp_host: e.target.value})}
                    className="rounded-xl bg-muted/30"
                  />
                  <Input 
                    placeholder="Username" 
                    value={gateways.smtp_user}
                    onChange={e => setGateways({...gateways, smtp_user: e.target.value})}
                    className="rounded-xl bg-muted/30"
                  />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    value={gateways.smtp_pass}
                    onChange={e => setGateways({...gateways, smtp_pass: e.target.value})}
                    className="rounded-xl bg-muted/30"
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3 w-3" /> SMS Gateway
                  </h4>
                  <Input 
                    placeholder="API Key / Auth Token" 
                    value={gateways.sms_api_key}
                    onChange={e => setGateways({...gateways, sms_api_key: e.target.value})}
                    className="rounded-xl bg-muted/30"
                  />
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <p className="text-[10px] text-amber-600 leading-tight">
                      We support Twilio, Gupshup, and BulkSMS integrations by default.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" /> WhatsApp Business
                  </h4>
                  <Input 
                    placeholder="Meta Access Token" 
                    value={gateways.whatsapp_token}
                    onChange={e => setGateways({...gateways, whatsapp_token: e.target.value})}
                    className="rounded-xl bg-muted/30"
                  />
                  <Input 
                    placeholder="Phone Number ID" 
                    value={gateways.whatsapp_phone_id}
                    onChange={e => setGateways({...gateways, whatsapp_phone_id: e.target.value})}
                    className="rounded-xl bg-muted/30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-4">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">New Template</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Template Name</Label>
                    <Input 
                      value={newTemplate.name}
                      onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                      placeholder="e.g. Welcome Email" 
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Channel</Label>
                    <Select 
                      value={newTemplate.channel}
                      onValueChange={v => setNewTemplate({...newTemplate, channel: v})}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Content</Label>
                    <Textarea 
                      value={newTemplate.content}
                      onChange={e => setNewTemplate({...newTemplate, content: e.target.value})}
                      placeholder="Use {{variable}} for dynamic data..." 
                      className="min-h-[150px] rounded-lg bg-muted/20"
                    />
                  </div>
                  <Button onClick={addTemplate} className="w-full rounded-lg" variant="secondary">
                    <Plus className="h-4 w-4 mr-2" /> Add Template
                  </Button>
                </CardContent>
              </Card>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                <h4 className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                  <Variable className="h-3 w-3" /> Available Variables
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['{{customer_name}}', '{{order_id}}', '{{total_amount}}', '{{tracking_link}}'].map(v => (
                    <code key={v} className="text-[9px] bg-background px-2 py-1 rounded-md border">{v}</code>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              {templates.map((tpl) => (
                <Card key={tpl.id} className="border-none shadow-lg overflow-hidden group">
                  <div className="flex">
                    <div className={cn(
                      "w-1.5",
                      tpl.channel === 'Email' ? "bg-blue-500" : 
                      tpl.channel === 'WhatsApp' ? "bg-emerald-500" : "bg-orange-500"
                    )} />
                    <div className="flex-1 p-4 flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">{tpl.name}</h4>
                          <Badge variant="secondary" className="text-[9px] h-4">{tpl.channel}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                          "{tpl.content}"
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="automations">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-4">
              <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Create Automation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Trigger Event</Label>
                    <Select defaultValue="order_placed">
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order_placed">When Order is Placed</SelectItem>
                        <SelectItem value="order_dispatched">When Order Dispatched</SelectItem>
                        <SelectItem value="low_stock">When Stock is Low</SelectItem>
                        <SelectItem value="abandoned_cart">Abandoned Cart (24h)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Action Channel</Label>
                    <Select defaultValue="whatsapp">
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Send Email</SelectItem>
                        <SelectItem value="sms">Send SMS</SelectItem>
                        <SelectItem value="whatsapp">Send WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Delay (Minutes)</Label>
                    <Input type="number" placeholder="0 for instant" className="rounded-lg" />
                  </div>

                  <Button className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
                    <Play className="h-4 w-4 mr-2" /> Activate Rule
                  </Button>
                </CardContent>
              </Card>

              <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20 text-center">
                <p className="text-[10px] text-muted-foreground italic">
                  "Automations run 24/7 on our cloud workers, ensuring your customers are always kept in the loop."
                </p>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              {automations.map((rule) => (
                <Card key={rule.id} className="border-none shadow-lg group overflow-hidden">
                   <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shadow-inner",
                        rule.active ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
                      )}>
                        <Zap className="h-5 w-5" />
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">Trigger</p>
                          <h4 className="text-sm font-bold">{rule.event}</h4>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                        
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">Action</p>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-primary">{rule.action}</h4>
                            <Badge variant="outline" className="text-[9px] px-1 h-3.5 border-primary/20">{rule.delay}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                       <Switch checked={rule.active} />
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                         <Trash2 className="h-3.5 w-3.5" />
                       </Button>
                    </div>
                   </div>
                   <div className="px-5 py-2 bg-muted/20 border-t flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <FileCode className="h-3 w-3" /> Using Template: <span className="font-bold text-primary">{rule.template}</span>
                      </p>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none h-4 text-[9px]">LIVE</Badge>
                   </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
