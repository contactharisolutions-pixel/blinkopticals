import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useSettings, useUpdateSetting } from '@/hooks/useSettings'
import { useShowrooms } from '@/hooks/useShowrooms'
import { Hash, Store, Save, Globe } from 'lucide-react'

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{label}</label>
      {children}
    </div>
  )
}

export const PrefixSettings: React.FC = () => {
  const { data: settings, isLoading: settingsLoading } = useSettings()
  const { data: showroomsResult, isLoading: showroomsLoading } = useShowrooms()
  const updateSetting = useUpdateSetting()

  const [formData, setFormData] = useState<any>({
    global_barcode_prefix: 'BO',
    global_pos_prefix: 'POS',
    global_ecom_prefix: 'ECOM',
    showroom_rules: {}
  })

  const showrooms = Array.isArray(showroomsResult)
    ? showroomsResult
    : (showroomsResult as any)?.data || []

  useEffect(() => {
    if (settings?.prefix_rules) {
      setFormData(settings.prefix_rules)
    }
  }, [settings])

  const handleGlobal = (key: string, val: string) => setFormData((p: any) => ({ ...p, [key]: val }))

  const handleShowroom = (id: string, field: string, val: string) =>
    setFormData((p: any) => ({
      ...p,
      showroom_rules: {
        ...p.showroom_rules,
        [id]: { ...(p.showroom_rules[id] || {}), [field]: val }
      }
    }))

  const handleSave = () => {
    updateSetting.mutate({ key: 'prefix_rules', value: formData }, {
      onSuccess: () => toast.success('Prefix rules saved.'),
      onError: (e: any) => toast.error(e.message || 'Failed to save.')
    })
  }

  if (settingsLoading || showroomsLoading) return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-[60px] rounded-2xl" />
      <Skeleton className="h-[160px] rounded-2xl" />
      <Skeleton className="h-[280px] rounded-2xl" />
    </div>
  )

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-10">

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3">
        <div>
          <p className="text-[14px] font-bold text-foreground">Prefix Rules</p>
          <p className="text-[12px] text-muted-foreground">Invoice and barcode prefix configuration</p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updateSetting.isPending}
          className="h-9 px-4 gap-1.5 rounded-xl text-[12px] font-semibold"
        >
          <Save className="h-3.5 w-3.5" />
          {updateSetting.isPending ? 'Saving…' : 'Save Rules'}
        </Button>
      </div>

      {/* Global prefixes */}
      <Section
        title="Global Prefixes"
        description="Default prefixes used across all showrooms unless overridden below"
      >
        <div className="grid grid-cols-3 gap-4">
          <Field label="Barcode Prefix">
            <Input
              value={formData.global_barcode_prefix || ''}
              onChange={(e) => handleGlobal('global_barcode_prefix', e.target.value)}
              placeholder="BO"
              className="h-9 rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors text-sm font-mono uppercase"
            />
          </Field>
          <Field label="POS Invoice Prefix">
            <Input
              value={formData.global_pos_prefix || ''}
              onChange={(e) => handleGlobal('global_pos_prefix', e.target.value)}
              placeholder="POS"
              className="h-9 rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors text-sm font-mono uppercase"
            />
          </Field>
          <Field label="Ecommerce Invoice Prefix">
            <Input
              value={formData.global_ecom_prefix || ''}
              onChange={(e) => handleGlobal('global_ecom_prefix', e.target.value)}
              placeholder="ECOM"
              className="h-9 rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors text-sm font-mono uppercase"
            />
          </Field>
        </div>
      </Section>

      {/* Per-showroom overrides */}
      <Section
        title="Showroom Overrides"
        description="Set specific prefixes per showroom. Leave blank to use the global prefix."
      >
        {showrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Store className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-[13px] text-muted-foreground">No showrooms found.</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">Create showrooms first to configure per-showroom prefixes.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/40">
            {showrooms.map((showroom: any) => {
              const rules = formData.showroom_rules?.[showroom.showroom_id] || {}
              return (
                <div key={showroom.showroom_id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <p className="text-[13px] font-semibold text-foreground">{showroom.showroom_name}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pl-4">
                    <Field label="Barcode Prefix">
                      <Input
                        value={rules.barcode_prefix || ''}
                        onChange={(e) => handleShowroom(showroom.showroom_id, 'barcode_prefix', e.target.value)}
                        placeholder="Global default"
                        className="h-9 rounded-xl bg-muted/40 border-border/50 focus:bg-background text-sm font-mono"
                      />
                    </Field>
                    <Field label="POS Prefix">
                      <Input
                        value={rules.pos_prefix || ''}
                        onChange={(e) => handleShowroom(showroom.showroom_id, 'pos_prefix', e.target.value)}
                        placeholder="Global default"
                        className="h-9 rounded-xl bg-muted/40 border-border/50 focus:bg-background text-sm font-mono"
                      />
                    </Field>
                    <Field label="Ecom Prefix">
                      <Input
                        value={rules.ecom_prefix || ''}
                        onChange={(e) => handleShowroom(showroom.showroom_id, 'ecom_prefix', e.target.value)}
                        placeholder="Global default"
                        className="h-9 rounded-xl bg-muted/40 border-border/50 focus:bg-background text-sm font-mono"
                      />
                    </Field>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>

    </div>
  )
}
