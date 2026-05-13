import React from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings, useUpdateSetting } from '@/hooks/useSettings'
import { useCategories } from '@/hooks/useCatalog'
import { Skeleton } from "@/components/ui/skeleton"
import { Save, ReceiptText, Percent, Plus, Trash2, MapPin, Edit2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar", "Chandigarh", "Delhi", 
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export const TaxSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettings()
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories()
  const updateSetting = useUpdateSetting()
  const [formData, setFormData] = React.useState<any>({
    enable_gst: true,
    prices_include_tax: true,
    enable_igst_split: true,
    business_origin_state: 'Maharashtra',
    default_gst_rate: '12',
    category_rules: []
  })

  // To track which rules are currently in "Edit" mode
  const [editingRules, setEditingRules] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (settings?.tax_rules) {
      try {
        const parsed = typeof settings.tax_rules === 'string' ? JSON.parse(settings.tax_rules) : settings.tax_rules;
        // Ensure legacy rules have active flag
        if (parsed.category_rules) {
          parsed.category_rules = parsed.category_rules.map((r: any) => ({
            ...r,
            active: r.active !== false // default to true
          }))
        }
        setFormData(parsed)
      } catch (e) {}
    }
  }, [settings])

  const handleSave = () => {
    updateSetting.mutate({ key: 'tax_rules', value: formData }, {
      onSuccess: () => {
        toast.success('Tax & GST rules saved successfully!')
      }
    })
    setEditingRules({}) // Exit all edit modes on save
  }

  const addRule = () => {
    const newId = Date.now().toString()
    setFormData({
      ...formData,
      category_rules: [...(formData.category_rules || []), { id: newId, category: '', rate: '18', active: true }]
    })
    setEditingRules({ ...editingRules, [newId]: true }) // Open in edit mode
  }

  const removeRule = (id: string) => {
    setFormData({
      ...formData,
      category_rules: formData.category_rules.filter((r: any) => r.id !== id)
    })
  }

  const updateRule = (id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      category_rules: formData.category_rules.map((r: any) => r.id === id ? { ...r, [field]: value } : r)
    })
  }

  const toggleEditRule = (id: string) => {
    setEditingRules({ ...editingRules, [id]: !editingRules[id] })
  }

  if (isLoading || isCategoriesLoading) return <Skeleton className="h-[400px] w-full" />

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3">
        <div>
          <p className="text-[14px] font-bold text-foreground">Tax & GST</p>
          <p className="text-[12px] text-muted-foreground">Configure GST slabs, CGST/SGST rules, and category tax rates</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={updateSetting.isPending}
          className="h-9 px-4 gap-1.5 rounded-xl text-[12px] font-semibold">
          <Save className="h-3.5 w-3.5" />
          {updateSetting.isPending ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
      {/* Main card */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        <div className="p-6 grid gap-8">
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-4 p-4 border rounded-xl bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold flex items-center gap-2">Enable GST Invoicing</Label>
                  <p className="text-xs text-muted-foreground">Calculate taxes on checkout and invoices.</p>
                </div>
                <Switch 
                  checked={formData.enable_gst}
                  onCheckedChange={(c) => setFormData({...formData, enable_gst: c})}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 p-4 border rounded-xl bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold flex items-center gap-2">Prices Include Tax</Label>
                  <p className="text-xs text-muted-foreground">Retail prices already include GST amount.</p>
                </div>
                <Switch 
                  checked={formData.prices_include_tax}
                  onCheckedChange={(c) => setFormData({...formData, prices_include_tax: c})}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 border-t pt-8">
            <div className="space-y-3">
              <Label className="text-sm font-bold flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> Business Origin State</Label>
              <Select 
                value={formData.business_origin_state} 
                onValueChange={(v) => setFormData({...formData, business_origin_state: v})}
              >
                <SelectTrigger className="w-full rounded-xl bg-muted/30">
                  <SelectValue placeholder="Select Origin State" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Required to determine intrastate vs interstate tax rules.</p>
            </div>

            <div className="flex flex-col gap-4 p-4 border rounded-xl bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold flex items-center gap-2 text-primary">Auto-Split CGST & SGST / IGST</Label>
                  <p className="text-xs text-muted-foreground">Dynamically apply CGST+SGST (Intrastate) or IGST (Interstate) based on customer address.</p>
                </div>
                <Switch 
                  checked={formData.enable_igst_split}
                  onCheckedChange={(c) => setFormData({...formData, enable_igst_split: c})}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start">
            <ReceiptText className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900">Centralized GST Management</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                GST rates and HSN codes are now managed directly within <b>Master Data &gt; Categories</b>. 
                Individual category overrides and fallback rates here have been deprecated to ensure tax compliance consistency across the entire ERP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
