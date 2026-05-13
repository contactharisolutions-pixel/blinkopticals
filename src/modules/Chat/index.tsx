import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { 
  MessageSquare, User, Bot, Send, RefreshCw, Sparkles, 
  Settings, Plus, Trash2, Edit3, Smartphone, Laptop, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight
} from 'lucide-react'

export default function ChatManagement() {
  const [sessions, setSessions] = React.useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<any[]>([])
  const [knowledge, setKnowledge] = React.useState<any[]>([])
  
  // Forms
  const [replyText, setReplyText] = React.useState('')
  const [faqForm, setFaqForm] = React.useState({ id: null, intent: '', keywords: '', answer: '' })
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSending, setIsSending] = React.useState(false)

  // Polling / Refreshes
  const loadSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions').then(r => r.json())
      if (res.success) {
        setSessions(res.data || [])
        if (!selectedSessionId && res.data?.length > 0) {
          setSelectedSessionId(res.data[0].session_id)
        }
      }
    } catch (e) { console.warn('Sessions poll error', e) }
    finally { setIsLoading(false) }
  }

  const loadMessages = async (sid: string) => {
    try {
      const res = await fetch(`/api/chat/history/${sid}`).then(r => r.json())
      if (res.success) setMessages(res.data || [])
    } catch (e) { console.warn('Messages poll error', e) }
  }

  const loadKnowledge = async () => {
    try {
      const res = await fetch('/api/chat/knowledge').then(r => r.json())
      if (res.success) setKnowledge(res.data || [])
    } catch (e) {}
  }

  React.useEffect(() => {
    loadSessions()
    loadKnowledge()
    const timer = setInterval(() => {
      loadSessions()
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  React.useEffect(() => {
    if (selectedSessionId) {
      loadMessages(selectedSessionId)
      const msgTimer = setInterval(() => {
        loadMessages(selectedSessionId)
      }, 2500)
      return () => clearInterval(msgTimer)
    }
  }, [selectedSessionId])

  // Actions
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!replyText.trim() || !selectedSessionId) return

    setIsSending(true)
    const backupText = replyText
    setReplyText('')

    // Optimistically update
    setMessages(prev => [
      ...prev,
      { message_id: `temp_${Date.now()}`, session_id: selectedSessionId, sender: 'agent', message: backupText, created_at: new Date().toISOString() }
    ])

    try {
      const res = await fetch('/api/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: selectedSessionId, message: backupText })
      }).then(r => r.json())

      if (res.success) {
        loadMessages(selectedSessionId)
        loadSessions()
      } else {
        toast.error('Failed to dispatch message.')
      }
    } catch (err) { toast.error('Network transport error.') }
    finally { setIsSending(false) }
  }

  const handleToggleBot = async (sid: string, currentVal: boolean) => {
    try {
      const res = await fetch(`/api/chat/session/${sid}/toggle-bot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_active: !currentVal })
      }).then(r => r.json())

      if (res.success) {
        toast.success(`Session routed to ${!currentVal ? 'AI Bot Engine' : 'Manual Escalation'}`)
        loadSessions()
      }
    } catch (e) { toast.error('Failed to switch state') }
  }

  // FAQ CRUD
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!faqForm.intent || !faqForm.answer) {
      toast.error('Please complete Intent and Answer descriptions.')
      return
    }

    try {
      const url = faqForm.id ? `/api/chat/knowledge/${faqForm.id}` : '/api/chat/knowledge'
      const method = faqForm.id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqForm)
      }).then(r => r.json())

      if (res.success) {
        toast.success(faqForm.id ? 'FAQ updated.' : 'FAQ created.')
        setFaqForm({ id: null, intent: '', keywords: '', answer: '' })
        loadKnowledge()
      } else { toast.error('Failed to save configuration.') }
    } catch(e) { toast.error('Server sync error.') }
  }

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Permanently remove this bot auto-response filter?')) return
    try {
      const res = await fetch(`/api/chat/knowledge/${id}`, { method: 'DELETE' }).then(r => r.json())
      if (res.success) {
        toast.success('Knowledge context deleted.')
        loadKnowledge()
      }
    } catch(e){}
  }

  const activeSessionObj = sessions.find(s => s.session_id === selectedSessionId)

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-[1700px] mx-auto p-4 md:p-6 gap-6 animate-in fade-in duration-300">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 border border-border/40 backdrop-blur-md rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-foreground tracking-tight">AI Bot & Live Support Desk</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[11px] font-bold border border-indigo-500/20">
                Active Telemetry
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitor dynamic visitor sessions, override auto-response flows, and tune vector keywords.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { loadSessions(); loadKnowledge(); toast.info('Telemetry matrix refreshed.'); }}
            className="rounded-xl border-border/60 hover:bg-muted/40 h-9 px-3 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Buffers
          </Button>
        </div>
      </div>

      {/* ── Main Workspace Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* 1. SESSIONS COLUMN (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Visitors</h3>
            <span className="text-[11px] font-bold bg-muted px-2 py-0.5 rounded-md text-foreground">
              {sessions.length} Threads
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2 space-y-1">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-xl"><Skeleton className="h-10 w-full rounded-lg" /></div>
              ))
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No external visitor sessions tracked currently.
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = s.session_id === selectedSessionId
                const isMobile = s.device_info?.toLowerCase().includes('mobile')
                return (
                  <button
                    key={s.session_id}
                    onClick={() => setSelectedSessionId(s.session_id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 text-xs relative group",
                      isActive 
                        ? "bg-primary/10 border border-primary/20 text-foreground shadow-sm" 
                        : "hover:bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs mt-0.5",
                      s.bot_active ? "bg-violet-600" : "bg-emerald-600"
                    )}>
                      {s.bot_active ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-foreground truncate block">
                          {s.customer_name || 'Visitor'}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs truncate opacity-80 mt-1">
                        {s.last_message || <span className="italic text-muted-foreground/60">New Connection</span>}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                          s.bot_active ? "bg-violet-500/10 text-violet-400" : "bg-emerald-500/10 text-emerald-400"
                        )}>
                          {s.bot_active ? 'Auto AI' : 'Live Agent'}
                        </span>
                        {s.customer_mobile && (
                          <span className="text-[10px] font-mono text-muted-foreground">📞 {s.customer_mobile}</span>
                        )}
                        <span className="ml-auto text-[10px] opacity-60">
                          {isMobile ? <Smartphone className="h-3 w-3 inline" /> : <Laptop className="h-3 w-3 inline" />}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* 2. LIVE CHAT FEED (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm h-full">
          {activeSessionObj ? (
            <>
              {/* Session Context Header */}
              <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {activeSessionObj.customer_name?.charAt(0) || 'V'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate">
                      {activeSessionObj.customer_name}
                    </h4>
                    <span className="text-[10px] font-mono text-muted-foreground block truncate">
                      Token: {activeSessionObj.session_id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleToggleBot(activeSessionObj.session_id, activeSessionObj.bot_active)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all",
                      activeSessionObj.bot_active 
                        ? "bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20" 
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                    )}
                    title="Click to instantly toggle bot control state"
                  >
                    {activeSessionObj.bot_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    {activeSessionObj.bot_active ? 'AI Handling' : 'Agent Override'}
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 flex flex-col">
                {messages.length === 0 ? (
                  <div className="m-auto text-center p-6 text-xs text-muted-foreground/60 max-w-xs">
                    <Sparkles className="h-8 w-8 mx-auto opacity-30 mb-2 animate-pulse" />
                    Thread unpopulated. Streaming raw socket inputs directly to workspace buffers upon customer connection.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isUser = m.sender === 'user'
                    const isBot = m.sender === 'bot'
                    return (
                      <div
                        key={m.message_id}
                        className={cn(
                          "flex flex-col max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm relative group animate-in fade-in duration-200",
                          isUser 
                            ? "self-start bg-card border border-border/50 text-foreground rounded-tl-sm" 
                            : isBot 
                            ? "self-end bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white rounded-tr-sm"
                            : "self-end bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white rounded-tr-sm"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1 opacity-70 text-[9px] font-bold uppercase tracking-wider">
                          <span>{isUser ? 'Customer' : isBot ? 'AI Knowledge Engine' : 'Staff Override'}</span>
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="whitespace-pre-line leading-relaxed break-words font-medium">
                          {m.message}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Dispatch Form Input Area */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-border/50 bg-card flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an instant operator message..."
                  className="h-10 rounded-xl bg-muted/40 border-border/60 text-xs focus-visible:ring-1"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={isSending || !replyText.trim()}
                  className="h-10 rounded-xl px-4 bg-primary text-primary-foreground font-bold text-xs gap-1.5 flex-shrink-0 shadow-md"
                >
                  <Send className="h-3.5 w-3.5" />
                  Dispatch
                </Button>
              </form>
            </>
          ) : (
            <div className="m-auto text-center p-8 text-xs text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto opacity-20 mb-3" />
              Select an active visitor thread from the sidebar explorer to initialize message state buffers.
            </div>
          )}
        </div>

        {/* 3. KNOWLEDGE CONFIGURATION SUITE (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm h-full">
          <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Knowledge Banks</h3>
            <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Vector Matches
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-border/40">
            {/* Create/Edit Form */}
            <form onSubmit={handleSaveFaq} className="bg-muted/30 p-3.5 rounded-xl border border-border/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {faqForm.id ? 'Edit Intent Record' : 'Append Knowledge Intent'}
                </span>
                {faqForm.id && (
                  <button 
                    type="button" 
                    onClick={() => setFaqForm({ id: null, intent: '', keywords: '', answer: '' })}
                    className="text-[10px] text-indigo-400 underline"
                  >
                    Reset Form
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1 uppercase tracking-wider">Intent Identifier</label>
                  <Input
                    value={faqForm.intent}
                    onChange={(e) => setFaqForm(p => ({ ...p, intent: e.target.value }))}
                    placeholder="e.g. shipping_duration"
                    className="h-8 text-xs rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1 uppercase tracking-wider">Trigger Tokens</label>
                  <Input
                    value={faqForm.keywords}
                    onChange={(e) => setFaqForm(p => ({ ...p, keywords: e.target.value }))}
                    placeholder="ship,delivery,days"
                    className="h-8 text-xs rounded-lg bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1 uppercase tracking-wider">Automated Rich Answer</label>
                <textarea
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm(p => ({ ...p, answer: e.target.value }))}
                  placeholder="Orders normally dispatch within 24 hours of successful inventory checkout verification..."
                  className="w-full h-16 rounded-lg bg-background border border-border/60 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <Button type="submit" size="sm" className="w-full h-8 text-xs font-bold rounded-lg gap-1.5">
                {faqForm.id ? <Edit3 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {faqForm.id ? 'Commit Modification' : 'Inject Vector Answer'}
              </Button>
            </form>

            {/* List Array */}
            <div className="pt-3 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Active Configured Rules ({knowledge.length})
              </span>
              
              {knowledge.map((k) => (
                <div key={k.id} className="p-3 bg-muted/20 rounded-xl border border-border/40 hover:border-border transition-colors relative group">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-foreground tracking-wide block">
                        #{k.intent}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-400 block mt-0.5">
                        [{k.keywords}]
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setFaqForm(k)}
                        className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                        title="Load Record"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(k.id)}
                        className="p-1 hover:bg-destructive/10 rounded text-destructive"
                        title="Purge Record"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3 bg-background/50 p-2 rounded-lg border border-border/30">
                    {k.answer}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  )
}
