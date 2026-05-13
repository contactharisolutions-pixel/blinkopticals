import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { 
  Search, Sparkles, Globe, RefreshCw, FileText, CheckCircle2, 
  AlertCircle, Layers, Smartphone, Monitor, Save, Edit3, Tag
} from 'lucide-react'

type TaxonomyType = 'pages' | 'categories' | 'brands' | 'genders' | 'products'

export default function SeoManagementWorkspace() {
  const [activeTab, setActiveTab] = useState<TaxonomyType>('pages')
  const [entities, setEntities] = useState<any[]>([])
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null)
  
  // Custom Override Editor State
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formKeywords, setFormKeywords] = useState('')
  
  // Simulator Scope View Toggle
  const [simulatorMode, setSimulatorMode] = useState<'desktop' | 'mobile'>('desktop')
  
  // Loading flags
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isBatchRunning, setIsBatchRunning] = useState(false)

  // Fetch Taxonomy Array
  const fetchTaxonomyEntities = async (type: TaxonomyType) => {
    setIsLoading(true)
    setSelectedEntity(null)
    try {
      const res = await fetch(`/api/seo/entities?type=${type}`).then(r => r.json())
      if (res.success) {
        setEntities(res.data || [])
        if (res.data?.length > 0) {
          selectItemForEdit(res.data[0])
        }
      } else {
        toast.error('Failed to load SEO inventory namespace.')
      }
    } catch (e) { toast.error('Network communications error.') }
    finally { setIsLoading(false) }
  }

  useEffect(() => {
    fetchTaxonomyEntities(activeTab)
  }, [activeTab])

  const selectItemForEdit = (item: any) => {
    setSelectedEntity(item)
    setFormTitle(item.seo_title || '')
    setFormDesc(item.seo_description || '')
    setFormKeywords(item.seo_keywords || '')
  }

  // Single entity triggers
  const handleAutoGenerateSingle = async () => {
    if (!selectedEntity) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEntity.id,
          type: activeTab,
          name: selectedEntity.name || selectedEntity.model_no || 'Item',
          context: `Taxonomy scope mapping: ${activeTab}.`
        })
      }).then(r => r.json())

      if (res.success && res.data) {
        toast.success('AI Prompt generation successful.')
        setFormTitle(res.data.seo_title || '')
        setFormDesc(res.data.seo_description || '')
        setFormKeywords(res.data.seo_keywords || '')
        
        // Update item in local list array directly
        setEntities(prev => prev.map(e => e.id === selectedEntity.id ? { 
          ...e, 
          seo_title: res.data.seo_title, 
          seo_description: res.data.seo_description, 
          seo_keywords: res.data.seo_keywords 
        } : e))
      } else {
        toast.error('AI API limit reached. Applied curated fallback text strings.')
      }
    } catch (e) { toast.error('Generation transport failure.') }
    finally { setIsGenerating(false) }
  }

  // Manual save override commit
  const handleManualCommitOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEntity) return
    setIsGenerating(true)
    try {
      const payload = {
        seo_title: formTitle,
        seo_description: formDesc,
        seo_keywords: formKeywords
      }
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEntity.id,
          type: activeTab,
          name: selectedEntity.name || 'Item',
          isManualOverride: true,
          manualData: payload
        })
      }).then(r => r.json())

      if (res.success) {
        toast.success('Custom metadata override committed cleanly.')
        setEntities(prev => prev.map(e => e.id === selectedEntity.id ? { ...e, ...payload } : e))
      } else { toast.error('Failed to save configuration updates.') }
    } catch(e) { toast.error('Network sync failure.') }
    finally { setIsGenerating(false) }
  }

  // Bulk operation executor
  const handleTriggerBulkBatch = async () => {
    const incomplete = entities.filter(e => !e.seo_title || !e.seo_description)
    if (incomplete.length === 0) {
      toast.info('All nodes inside this taxonomy scope already exhibit baseline SEO meta mapping.')
      return
    }

    if (!confirm(`Dispatch intelligent generation pipeline across ${incomplete.length} unoptimized records asynchronously?`)) return
    
    setIsBatchRunning(true)
    const itemsPayload = incomplete.map(e => ({ id: e.id, name: e.name || e.model_no || 'Item' }))
    
    try {
      const res = await fetch('/api/seo/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload, type: activeTab })
      }).then(r => r.json())

      if (res.success) {
        toast.success(`Batch execution complete. Processed ${res.processed} candidate records.`)
        fetchTaxonomyEntities(activeTab)
      } else { toast.error('Bulk executor processing exception.') }
    } catch(e) { toast.error('Bulk job dispatcher error.') }
    finally { setIsBatchRunning(false) }
  }

  // Calculate live dynamic layout outputs for simulator simulation
  const renderSimulatedTitle = formTitle.trim() || `${selectedEntity?.name || 'Asset Title'} Premium Showcase | BlinkOpticals`
  const renderSimulatedDesc = formDesc.trim() || `Explore tailored luxury finishes and prescription features for ${selectedEntity?.name || 'this catalog asset'}. Verified original quality and fast diagnostics available.`
  const simulatedSlugPath = selectedEntity?.slug ? `/${selectedEntity.slug}` : `/${activeTab}/${selectedEntity?.id || 'node'}`

  const totalOptimized = entities.filter(e => e.seo_title && e.seo_description).length
  const optimizationPercent = entities.length > 0 ? Math.round((totalOptimized / entities.length) * 100) : 100

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-[1700px] mx-auto p-4 md:p-6 gap-6 animate-in fade-in duration-300">
      
      {/* ── HEADER TELEMETRY SUITE ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 border border-border/40 backdrop-blur-md rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-foreground tracking-tight">AI Base SEO Engine</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[11px] font-bold border border-orange-500/20">
                JSON-LD Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Programmatically synthesize search snippets, meta strings, and microdata parameters across multi-level entities.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={isBatchRunning || isLoading}
            onClick={handleTriggerBulkBatch} 
            className="rounded-xl border-orange-500/30 hover:bg-orange-500/10 text-orange-400 h-9 px-3 gap-1.5 text-xs font-bold"
          >
            <Sparkles className={cn("h-3.5 w-3.5", isBatchRunning && "animate-spin")} />
            {isBatchRunning ? 'Batch Executing...' : 'Mass Generate Missing Meta'}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchTaxonomyEntities(activeTab)} 
            className="rounded-xl border-border/60 hover:bg-muted/40 h-9 px-3 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Schema
          </Button>
        </div>
      </div>

      {/* ── CENTRAL MATRIX EXPLORER TIER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN: TAXONOMY SELECTOR & ITEM LIST (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm h-full">
          
          {/* Taxonomy Tabs */}
          <div className="p-2 border-b border-border/50 bg-muted/20 grid grid-cols-5 gap-1">
            {(['pages', 'categories', 'brands', 'genders', 'products'] as TaxonomyType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-2 px-1 rounded-lg text-[11px] font-bold capitalize transition-all text-center truncate",
                  activeTab === tab 
                    ? "bg-background text-foreground shadow-sm border border-border/40" 
                    : "hover:bg-muted/60 text-muted-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Ratio Progress Meter */}
          <div className="px-4 py-2 bg-background/40 border-b border-border/30 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium text-[11px]">
              Taxonomy Integrity Score:
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500" 
                  style={{ width: `${optimizationPercent}%` }} 
                />
              </div>
              <span className="font-extrabold text-foreground text-[11px]">
                {optimizationPercent}%
              </span>
            </div>
          </div>

          {/* List Box Explorer */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2 space-y-1">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3"><Skeleton className="h-10 w-full rounded-xl" /></div>
              ))
            ) : entities.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No indexed items associated with this taxonomy hierarchy block.
              </div>
            ) : (
              entities.map((item) => {
                const isSelected = selectedEntity?.id === item.id
                const isOptimized = !!(item.seo_title && item.seo_description)
                
                return (
                  <button
                    key={item.id}
                    onClick={() => selectItemForEdit(item)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 text-xs relative group",
                      isSelected 
                        ? "bg-orange-500/10 border border-orange-500/20 text-foreground shadow-sm" 
                        : "hover:bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold",
                      isOptimized ? "bg-emerald-600" : "bg-amber-500"
                    )}>
                      {isOptimized ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-foreground truncate block">
                          {item.name || item.model_no || 'Catalog Asset'}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 font-mono">
                          ID: {item.id ? String(item.id).slice(-6) : 'N/A'}
                        </span>
                      </div>

                      <p className="text-[11px] truncate opacity-75 mt-0.5">
                        {item.seo_title || <span className="italic text-muted-foreground/60">Missing Title Tag</span>}
                      </p>
                      
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.2 rounded font-bold",
                          item.seo_description ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"
                        )}>
                          {item.seo_description ? 'Meta Description Active' : 'No Snippet Content'}
                        </span>
                        {item.seo_keywords && (
                          <span className="text-[9px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground truncate max-w-[120px]">
                            🔑 {item.seo_keywords}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

        </div>


        {/* RIGHT COLUMN: MANUAL OVERRIDE EDITOR & GOOGLE SIMULATOR (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-full min-h-0">
          
          {selectedEntity ? (
            <>
              {/* 1. REAL-TIME GOOGLE SERP SIMULATOR CARD */}
              <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm flex flex-col flex-shrink-0">
                
                {/* Simulator Mode Bar */}
                <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Live SERP Rendering Simulator
                    </span>
                  </div>

                  <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/40">
                    <button 
                      onClick={() => setSimulatorMode('desktop')}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all",
                        simulatorMode === 'desktop' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Monitor className="h-3 w-3" />
                      Desktop
                    </button>
                    <button 
                      onClick={() => setSimulatorMode('mobile')}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all",
                        simulatorMode === 'mobile' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Smartphone className="h-3 w-3" />
                      Mobile View
                    </button>
                  </div>
                </div>

                {/* Simulated Rendering Container */}
                <div className={cn(
                  "p-4 rounded-xl border border-border/50 bg-background/60 mx-auto w-full transition-all duration-300",
                  simulatorMode === 'mobile' ? "max-w-[375px] shadow-inner" : "max-w-full"
                )}>
                  
                  {/* Breadcrumb / URL string block */}
                  <div className="flex items-center gap-1 text-[11px] text-[#4d5156] dark:text-[#bdc1c6] font-sans truncate mb-1">
                    <span className="font-medium text-[#202124] dark:text-[#e8eaed]">BlinkOpticals</span>
                    <span className="opacity-60">›</span>
                    <span className="truncate opacity-90">https://www.blinkopticals.com{simulatedSlugPath}</span>
                  </div>

                  {/* Title Link string */}
                  <div className="text-[18px] font-sans text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-tight mb-1 truncate block font-normal">
                    {renderSimulatedTitle}
                  </div>

                  {/* Rich Snippet block */}
                  <p className="text-[12px] font-sans text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2 break-words m-0">
                    {renderSimulatedDesc}
                  </p>

                  {/* Fallback Microdata Tag simulation view */}
                  <div className="mt-2.5 pt-2 border-t border-border/30 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono text-orange-400">
                      <Tag className="h-2.5 w-2.5" /> 
                      schema.org/{activeTab === 'products' ? 'Product' : 'CollectionPage'}
                    </span>
                    <span>•</span>
                    <span className="truncate">Keywords cluster active</span>
                  </div>

                </div>

              </div>


              {/* 2. OVERRIDE EDITOR FORM */}
              <div className="bg-card border border-border/60 rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
                
                <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Metadata Tuning Override Suite
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isGenerating}
                    onClick={handleAutoGenerateSingle}
                    className="h-8 px-2.5 rounded-lg border-indigo-500/30 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10 text-xs font-bold gap-1.5"
                  >
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    AI Auto Prompting
                  </Button>
                </div>

                <form onSubmit={handleManualCommitOverride} className="p-4 flex-1 overflow-y-auto space-y-4">
                  
                  {/* Title Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Document Title Tag (<span className={cn(formTitle.length > 60 ? "text-destructive" : "text-emerald-500")}>{formTitle.length}</span>/60)
                      </label>
                      <span className="text-[10px] text-muted-foreground/60">Primary visual rank parameter</span>
                    </div>
                    <Input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Eyewear Product Name | Premium Brand"
                      className="h-9 text-xs rounded-xl bg-muted/40 border-border/60 font-medium"
                    />
                  </div>

                  {/* Description Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Meta Description Snippet (<span className={cn(formDesc.length > 160 ? "text-destructive" : "text-emerald-500")}>{formDesc.length}</span>/160)
                      </label>
                      <span className="text-[10px] text-muted-foreground/60">Direct trigger conversion vector</span>
                    </div>
                    <textarea
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      rows={3}
                      placeholder="Persuasive value proposition focusing on express delivery, designer validation, and clinical Rx guarantees..."
                      className="w-full rounded-xl bg-muted/40 border border-border/60 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium resize-none leading-relaxed"
                    />
                  </div>

                  {/* Keywords Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Search Keywords Matrix
                      </label>
                      <span className="text-[10px] text-muted-foreground/60">Comma-separated microdata attributes</span>
                    </div>
                    <Input
                      value={formKeywords}
                      onChange={(e) => setFormKeywords(e.target.value)}
                      placeholder="designer frames, premium glasses, prescription opticals"
                      className="h-9 text-xs rounded-xl bg-muted/40 border-border/60"
                    />
                  </div>

                  {/* Commit Action Footer */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-end gap-2">
                    <Button 
                      type="submit" 
                      size="sm" 
                      disabled={isGenerating}
                      className="h-9 rounded-xl px-5 bg-primary text-primary-foreground font-bold text-xs gap-1.5 shadow-md"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Commit Override Schema
                    </Button>
                  </div>

                </form>

              </div>
            </>
          ) : (
            <div className="m-auto text-center p-8 text-xs text-muted-foreground bg-card border border-border/60 rounded-2xl w-full flex-1 flex flex-col justify-center items-center">
              <Layers className="h-10 w-10 mx-auto opacity-20 mb-3" />
              Select an entry item from the taxonomy data array explorer to unlock visual metadata simulation layouts.
            </div>
          )}

        </div>

      </div>

    </div>
  )
}
