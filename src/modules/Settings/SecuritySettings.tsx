import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings, useUpdateSetting } from '@/hooks/useSettings'
import { Save, Shield, Key, Clock, ShieldAlert, ShieldCheck, Lock } from 'lucide-react'
import { toast } from 'sonner'

// ─── Shared primitives ────────────────────────────────────────────────────────
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50">
        <h3 className="text-[14px] font-bold text-foreground">{title}</h3>
        {description && <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function ToggleRow({ icon: Icon, label, description, checked, onCheckedChange }: {
  icon: React.ElementType; label: string; description: string; checked: boolean; onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="flex-shrink-0" />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export const SecuritySettings: React.FC = () => {
  const { data: settings, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()
  const [formData, setFormData] = React.useState<any>({
    require_2fa: false,
    session_timeout: '60',
    password_expiry: false,
    bruteforce_protection: true,
    allowed_ips: '',
    min_password_length: 8,
    require_special_char: false,
  })

  React.useEffect(() => {
    if (settings?.security) {
      try {
        setFormData(typeof settings.security === 'string' ? JSON.parse(settings.security) : settings.security)
      } catch {}
    }
  }, [settings])

  const set = (key: string, val: any) => setFormData((p: any) => ({ ...p, [key]: val }))

  const handleSave = () => {
    updateSetting.mutate({ key: 'security', value: formData }, {
      onSuccess: () => toast.success('Security settings saved.'),
      onError: () => toast.error('Failed to save security settings.')
    })
  }

  if (isLoading) return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-[60px] rounded-2xl" />
      <Skeleton className="h-[240px] rounded-2xl" />
      <Skeleton className="h-[200px] rounded-2xl" />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3">
        <div>
          <p className="text-[14px] font-bold text-foreground">Security & Access</p>
          <p className="text-[12px] text-muted-foreground">Authentication rules and IP restrictions</p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updateSetting.isPending}
          className="h-9 px-4 gap-1.5 rounded-xl text-[12px] font-semibold"
        >
          <Save className="h-3.5 w-3.5" />
          {updateSetting.isPending ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>

      {/* Auth toggles */}
      <Section title="Authentication" description="Control how staff access the system">
        <ToggleRow
          icon={Key}
          label="Two-Factor Authentication"
          description="Force all staff to verify identity via authenticator app on every login."
          checked={!!formData.require_2fa}
          onCheckedChange={(v) => set('require_2fa', v)}
        />
        <ToggleRow
          icon={Clock}
          label="Password Expiry (90 days)"
          description="Staff will be prompted to change their password every 90 days."
          checked={!!formData.password_expiry}
          onCheckedChange={(v) => set('password_expiry', v)}
        />
        <ToggleRow
          icon={ShieldAlert}
          label="Brute Force Protection"
          description="Lock account for 15 minutes after 5 consecutive failed login attempts."
          checked={!!formData.bruteforce_protection}
          onCheckedChange={(v) => set('bruteforce_protection', v)}
        />
      </Section>

      {/* Access policy */}
      <Section title="Access Policy" description="Session and network controls">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Session Timeout
            </label>
            <Select value={formData.session_timeout} onValueChange={(v) => set('session_timeout', v)}>
              <SelectTrigger className="h-9 rounded-xl bg-muted/40 border-border/50 text-sm">
                <SelectValue placeholder="Select timeout" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="15">15 Minutes (High Security)</SelectItem>
                <SelectItem value="30">30 Minutes</SelectItem>
                <SelectItem value="60">1 Hour (Standard)</SelectItem>
                <SelectItem value="720">12 Hours (Reduced Security)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-1.5">
              <Shield className="h-3 w-3" /> IP Whitelist (optional)
            </label>
            <Input
              placeholder="192.168.1.1, 10.0.0.0/24"
              value={formData.allowed_ips || ''}
              onChange={(e) => set('allowed_ips', e.target.value)}
              className="h-9 rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors text-sm font-mono"
            />
          </div>
        </div>
      </Section>

      {/* Password complexity */}
      <Section title="Password Complexity" description="Minimum requirements for staff passwords">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Minimum Length
            </label>
            <Input
              type="number"
              value={formData.min_password_length || 8}
              onChange={(e) => set('min_password_length', e.target.value)}
              className="h-9 rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
              Require Special Character
            </label>
            <div className="flex items-center gap-3 h-9 px-3 bg-muted/40 border border-border/50 rounded-xl">
              <Switch
                checked={!!formData.require_special_char}
                onCheckedChange={(v) => set('require_special_char', v)}
              />
              <span className="text-sm text-muted-foreground">{formData.require_special_char ? 'Required' : 'Optional'}</span>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-4 flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200">
          <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-blue-700 leading-relaxed">
            Enterprise best practices recommend at least <strong>12 characters</strong> and
            mandatory <strong>Two-Factor Authentication</strong> for all admin roles.
          </p>
        </div>
      </Section>

    </div>
  )
}
