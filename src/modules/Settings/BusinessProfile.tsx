import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusinessMe, useUpdateBusiness } from '@/hooks/useBusiness'
import { MediaSelector } from '@/components/shared/MediaSelector'
import { Save, Building2, User, Mail, Phone, MapPin, Hash, Zap, Globe } from 'lucide-react'
import { toast } from 'sonner'

// ─── Shared field component ───────────────────────────────────────────────────
function Field({
  label, icon: Icon, children
}: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Shared section card ──────────────────────────────────────────────────────
function Section({
  title, description, children
}: { title: string; description?: string; children: React.ReactNode }) {
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export const BusinessProfile: React.FC = () => {
  const { data: business, isLoading } = useBusinessMe()
  const updateMutation = useUpdateBusiness()
  const [formData, setFormData] = React.useState<any>({})

  React.useEffect(() => {
    if (business) {
      // Gracefully parse stringified JSON if database returns a string payload
      let parsedBiz = { ...business };
      if (typeof parsedBiz.social_links === 'string') {
        try { parsedBiz.social_links = JSON.parse(parsedBiz.social_links); } catch(e){}
      }
      setFormData(parsedBiz)
    }
  }, [business])

  const set = (key: string, val: any) => setFormData((p: any) => ({ ...p, [key]: val }))
  const setSocial = (network: string, val: string) => {
    setFormData((p: any) => ({
      ...p,
      social_links: {
        ...(p.social_links || {}),
        [network]: val
      }
    }))
  }

  const handleSave = () => {
    updateMutation.mutate(formData, {
      onSuccess: () => toast.success('Business profile saved.'),
      onError: (e: any) => toast.error(e.message || 'Failed to save.')
    })
  }

  if (isLoading) return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-[180px] rounded-2xl" />
      <Skeleton className="h-[340px] rounded-2xl" />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Toolbar ── */}
      <div className="bg-card border border-border/60 rounded-2xl" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p className="text-[14px] font-bold text-foreground">Business Profile</p>
          <p className="text-[12px] text-muted-foreground">Legal identity and contact information</p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="h-9 px-4 gap-1.5 rounded-xl text-[12px] font-semibold"
        >
          <Save className="h-3.5 w-3.5" />
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      {/* ── Brand Identity ── */}
      <Section title="Brand Identity" description="Upload your business logo and favicon">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-full h-[110px] rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center bg-muted/30 overflow-hidden">
              <MediaSelector
                businessId={business?.business_id || ''}
                currentValue={formData.logo_url}
                onSelect={(url) => set('logo_url', url)}
              />
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Business Logo</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-full h-[110px] rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center bg-muted/30 overflow-hidden">
              <MediaSelector
                businessId={business?.business_id || ''}
                currentValue={formData.favicon_url}
                onSelect={(url) => set('favicon_url', url)}
              />
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Site Favicon</p>
          </div>
        </div>
      </Section>

      {/* ── Contact Info ── */}
      <Section title="Contact Information" description="Primary business name, owner, and contact details">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Business Name" icon={Building2}>
            <Input
              value={formData.business_name || ''}
              onChange={(e) => set('business_name', e.target.value)}
              className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
            />
          </Field>
          <Field label="Owner Name" icon={User}>
            <Input
              value={formData.owner_name || ''}
              onChange={(e) => set('owner_name', e.target.value)}
              className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
            />
          </Field>
          <Field label="Email Address" icon={Mail}>
            <Input
              type="email"
              value={formData.email || ''}
              onChange={(e) => set('email', e.target.value)}
              className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
            />
          </Field>
          <Field label="Mobile Number" icon={Phone}>
            <Input
              value={formData.mobile_number || ''}
              onChange={(e) => set('mobile_number', e.target.value)}
              className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
            />
          </Field>
        </div>
      </Section>

      {/* ── Tax & Legal ── */}
      <Section title="Tax & Legal" description="GST, PAN, and registered address">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="GSTIN Number" icon={Hash}>
              <Input
                value={formData.gstin_main || ''}
                onChange={(e) => set('gstin_main', e.target.value)}
                className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm font-mono"
                placeholder="22AAAAA0000A1Z5"
              />
            </Field>
            <Field label="PAN Number" icon={Hash}>
              <Input
                value={formData.pan_no || ''}
                onChange={(e) => set('pan_no', e.target.value)}
                className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm font-mono"
                placeholder="AAAAA0000A"
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="City" icon={MapPin}>
              <Input
                value={formData.city || ''}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Surat"
                className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
              />
            </Field>
            <Field label="State">
              <Input
                value={formData.state || ''}
                onChange={(e) => set('state', e.target.value)}
                placeholder="Gujarat"
                className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
              />
            </Field>
            <Field label="Pincode">
              <Input
                value={formData.pincode || ''}
                onChange={(e) => set('pincode', e.target.value)}
                placeholder="395001"
                className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Social Media Links ── */}
      <Section title="Social Media Links" description="Connect your business presence to website footer links">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Facebook URL" icon={Globe}>
            <Input
              value={formData.social_links?.facebook || ''}
              onChange={(e) => setSocial('facebook', e.target.value)}
              placeholder="https://facebook.com/..."
              className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
            />
          </Field>
          <Field label="Instagram URL" icon={Globe}>
            <Input
              value={formData.social_links?.instagram || ''}
              onChange={(e) => setSocial('instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
            />
          </Field>
          <Field label="Twitter / X URL" icon={Globe}>
            <Input
              value={formData.social_links?.twitter || ''}
              onChange={(e) => setSocial('twitter', e.target.value)}
              placeholder="https://twitter.com/..."
              className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
            />
          </Field>
          <Field label="Pinterest URL" icon={Globe}>
            <Input
              value={formData.social_links?.pinterest || ''}
              onChange={(e) => setSocial('pinterest', e.target.value)}
              placeholder="https://pinterest.com/..."
              className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
            />
          </Field>
          <Field label="LinkedIn URL" icon={Globe}>
            <Input
              value={formData.social_links?.linkedin || ''}
              onChange={(e) => setSocial('linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/..."
              className="rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors h-9 text-sm"
            />
          </Field>
        </div>
      </Section>

      {/* ── Subscription ── */}
      <div className="bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/20 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">
              {business?.subscription_tier || 'Basic'} Plan
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="h-1.5 w-32 bg-border rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-primary rounded-full" />
              </div>
              <p className="text-[11px] text-muted-foreground">75% of features used</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 px-4 text-[12px] rounded-xl border-primary/30 text-primary hover:bg-primary/5 flex-shrink-0">
          Upgrade Plan
        </Button>
      </div>

    </div>
  )
}
