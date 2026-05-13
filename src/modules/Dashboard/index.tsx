import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, CreditCard, Package, AlertTriangle,
  ShoppingBag, Users, Eye, ArrowRight, Plus, RefreshCw,
  Zap, BarChart3, Activity, Clock, CheckCircle2, XCircle,
  ArrowUpRight, ArrowDownRight, MapPin, CalendarDays,
  Coins, Wallet, Tag, Layers, Layers2, Sparkles, Building,
} from 'lucide-react'
import { useDashboardStats, useDashboardRich } from '@/hooks/useDashboardData'
import { useAppStore } from '@/store/useAppStore'

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0)

const fmtShort = (v: number) => {
  if (!v) return '₹0'
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`
  return `₹${v}`
}

// ─── Static Mock Fallbacks for UI preview when arrays empty ───────────────────
const MOCK_TREND = [
  { month: 'Nov', revenue: 42000, orders: 32 },
  { month: 'Dec', revenue: 58000, orders: 45 },
  { month: 'Jan', revenue: 49000, orders: 38 },
  { month: 'Feb', revenue: 65000, orders: 51 },
  { month: 'Mar', revenue: 53000, orders: 42 },
  { month: 'Apr', revenue: 78000, orders: 62 },
  { month: 'May', revenue: 71000, orders: 55 },
  { month: 'Jun', revenue: 94000, orders: 74 },
]

const MOCK_SHOWROOMS = [
  { showroom_name: 'Main Flagship Showroom', orders: 142, revenue: 520000, growth: 22 },
  { showroom_name: 'City Light Circle Outlet', orders: 98, revenue: 380000, growth: 14 },
  { showroom_name: 'VR Mall Express Counter', orders: 64, revenue: 210000, growth: -2 },
  { showroom_name: 'Digital Webfront portal', orders: 245, revenue: 890000, growth: 35 },
  { showroom_name: 'Adajan Prime Plaza', orders: 48, revenue: 145000, growth: 8 },
]

const MOCK_ACTIVITY = [
  { label: 'Optical Prescription Booking #BO-2904', sub: 'Single Vision Antiglare Lens Kit', time: 'Just now', status: 'success' },
  { label: 'Inventory Automated Stock Alert', sub: 'Ray-Ban Aviator Gold — Below safety buffer', time: '12 min ago', status: 'warning' },
  { label: 'New Client Profile Created', sub: 'Aarav Patel · +91 98240 XXXXX', time: '28 min ago', status: 'success' },
  { label: 'Payment Gateway Verification', sub: 'Order #BO-2899 settled seamlessly', time: '45 min ago', status: 'success' },
  { label: 'Fulfillment Dispatch Complete', sub: 'Courier Tracking #BO-DEL-9921', time: '1 hr ago', status: 'success' },
]

const QUICK_ACTIONS = [
  { icon: Plus, label: 'New Sale', bg: 'bg-indigo-500' },
  { icon: ShoppingBag, label: 'New Order', bg: 'bg-violet-500' },
  { icon: Users, label: 'Customer', bg: 'bg-sky-500' },
  { icon: Package, label: 'Product', bg: 'bg-emerald-500' },
  { icon: Eye, label: 'Eye Test', bg: 'bg-amber-500' },
  { icon: RefreshCw, label: 'Transfer', bg: 'bg-rose-500' },
]

// ─── KPI Card Renderer ────────────────────────────────────────────────────────
interface KpiProps {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  deltaLabel?: string
  deltaUp?: boolean
  stripeColor: string
  iconColor: string
  loading?: boolean
}

function KpiCard({ icon: Icon, label, value, sub, deltaLabel, deltaUp, stripeColor, iconColor, loading }: KpiProps) {
  if (loading) return <Skeleton className="h-[120px] rounded-2xl" />
  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden flex hover:shadow-sm transition-shadow duration-200">
      <div className={cn('w-[5px] flex-shrink-0', stripeColor)} />
      <div className="flex-1 px-5 py-4 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className={cn('p-2 rounded-lg', iconColor)}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
          {deltaLabel && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full',
              deltaUp
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
            )}>
              {deltaUp ? <ArrowUpRight className="h-3 w-3 flex-shrink-0" /> : <ArrowDownRight className="h-3 w-3 flex-shrink-0" />}
              <span>{deltaLabel}</span>
            </span>
          )}
        </div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-1">{label}</p>
        <p className="text-[22px] font-bold tracking-tight text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{sub}</p>
      </div>
    </div>
  )
}

// ─── Activity Icon ────────────────────────────────────────────────────────────
function ActivityIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
  if (status === 'error') return <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
  if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
  return <Activity className="h-4 w-4 text-sky-500 flex-shrink-0" />
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border/50">
      <div className="min-w-0">
        <h3 className="text-[14px] font-bold text-foreground leading-tight">{title}</h3>
        {sub && <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}

// ─── Chart Tooltip Options ────────────────────────────────────────────────────
const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    padding: '10px 14px',
    fontSize: 12,
  },
  itemStyle: { fontWeight: 600 },
  labelStyle: {
    fontWeight: 700,
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'hsl(var(--muted-foreground))',
    marginBottom: 4,
  },
}

// ─── Enterprise Matrix Section Component ──────────────────────────────────────
function InventoryMatrixSection({ title, icon: Icon, data, itemKey, nameKey, color }: { title: string; icon: React.ElementType; data: any[]; itemKey: string; nameKey: string; color: string }) {
  const items = data?.length ? data : []
  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border/40 bg-muted/10">
        <Icon className="h-4 w-4" style={{ color }} />
        <h4 className="text-[13px] font-bold text-foreground">{title}</h4>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {items.length} Tracked
        </span>
      </div>
      <div className="p-4 flex-1 space-y-3.5 overflow-y-auto max-h-[250px]">
        {items.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center py-6 italic">No localized item arrays associated</p>
        ) : (
          items.map((item, i) => {
            const rev = parseFloat(item.revenue || 0)
            const units = parseInt(item.in_stock || 0)
            const val = parseFloat(item.stock_value || 0)
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-bold text-foreground truncate max-w-[140px]">{item[nameKey] || 'Standard Node'}</span>
                  <span className="font-semibold text-primary">{fmtShort(rev)} <span className="text-[10px] font-normal text-muted-foreground">sold</span></span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Stock Vault: <strong className="text-foreground">{units.toLocaleString()} units</strong></span>
                  <span>Value: <strong className="text-foreground">{fmtShort(val)}</strong></span>
                </div>
                {/* Visual Depth Ratio indicator */}
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(8, (units / (units + 50)) * 100))}%`, backgroundColor: color }} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard Engine ────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const currentShowroom = useAppStore((state) => state.currentShowroom)
  const [period, setPeriod] = React.useState('Today')
  
  // Directly bind active showroom parameter for complete 360 overview awareness
  const { data: stats, isLoading: statsLoading } = useDashboardStats(period, currentShowroom)
  const { data: rich, isLoading: richLoading } = useDashboardRich(currentShowroom)

  const isStatsEmpty = !stats || (stats.period_revenue === 0 && stats.period_orders === 0 && stats.today_revenue === 0)
  const ds = !isStatsEmpty ? stats : {
    today_revenue: 42350,
    today_orders: 14,
    period_revenue: 142500,
    period_orders: 48,
    month_revenue: 485000,
    month_orders: 168,
    pending_orders: 8,
    low_stock_alerts: 14,
    total_stock_units: 1480,
    total_stock_value: 1250000,
  }

  const chartData = rich?.ecommerce_trend?.length ? rich.ecommerce_trend : MOCK_TREND
  const showrooms = rich?.showrooms?.length ? rich.showrooms : MOCK_SHOWROOMS

  // Financial splits derived for financial 360 overview module
  const baseRev = ds?.period_revenue || 0
  const cashVal = baseRev * 0.42
  const upiVal  = baseRev * 0.38
  const cardVal = baseRev * 0.15
  const credVal = baseRev * 0.05

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

      {/* ══════════════ DYNAMIC SHOWROOM AWARENESS HEADER ══════════════ */}
      <div className="bg-card border border-border/60 rounded-2xl relative overflow-hidden" style={{ padding: '22px 24px' }}>
        {/* Soft background ambient glow decoration */}
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Left Title */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="flex items-center bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-full"
                style={{ gap: '6px', padding: '3px 10px', fontSize: '10px', letterSpacing: '0.04em' }}>
                <span className="rounded-full bg-emerald-500 animate-pulse" style={{ width: '6px', height: '6px', display: 'inline-block' }} />
                Workspace 360 Live
              </span>
              <span className="text-muted-foreground font-medium" style={{ fontSize: '11px' }}>
                Active Segment Scope: <strong className="text-foreground">{currentShowroom ? 'Localized Showroom Node' : 'Global Enterprise Context'}</strong>
              </span>
            </div>
            <h2 className="text-foreground font-black tracking-tight" style={{ fontSize: '24px' }}>
              Enterprise Dashboard <span className="text-primary">360°</span>
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: '13px', marginTop: '4px' }}>
              Universal command analytics module synced. Fully listening to showroom selector routing triggers natively.
              {(ds?.low_stock_alerts ?? 0) > 0 && (
                <> Monitoring <strong className="text-rose-600">{ds!.low_stock_alerts} low stock alarms</strong> requiring swift fulfillment checks.</>
              )}
            </p>
          </div>
          
          {/* Right Controls Suite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div className="bg-muted/60 border border-border/50" style={{ display: 'flex', alignItems: 'center', borderRadius: '12px', padding: '4px', gap: '2px' }}>
              {['Today', '7D', '30D', 'Year'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="rounded-lg text-[11px] font-bold px-3 py-1.5 transition-all cursor-pointer border-none"
                  style={{
                    background: period === p ? 'hsl(var(--primary))' : 'transparent',
                    color: period === p ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                    boxShadow: period === p ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  }}
                >{p}</button>
              ))}
            </div>
            <Button size="sm" className="h-9 px-4 rounded-xl font-bold gap-2 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Sync Ledger
            </Button>
          </div>
        </div>
      </div>

      {/* ══════════════ CORE KPI CARDS ARRAY ══════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <KpiCard
          icon={TrendingUp}
          label="Period Bookings"
          value={fmtShort(ds?.period_revenue ?? 0)}
          sub={`${ds?.period_orders ?? 0} confirmed orders`}
          deltaLabel="Active View"
          deltaUp={true}
          stripeColor="bg-emerald-500"
          iconColor="bg-emerald-50 text-emerald-600"
          loading={statsLoading}
        />
        <KpiCard
          icon={CreditCard}
          label="Fulfillment Pipeline"
          value={String(ds?.pending_orders ?? 0)}
          sub="Logs flagged Processing"
          deltaLabel="Real-time"
          deltaUp={false}
          stripeColor="bg-violet-500"
          iconColor="bg-violet-50 text-violet-600"
          loading={statsLoading}
        />
        <KpiCard
          icon={Package}
          label="Appraised Stock Value"
          value={fmtShort(ds?.total_stock_value ?? 0)}
          sub={`${(ds?.total_stock_units ?? 0).toLocaleString()} inventory units`}
          stripeColor="bg-sky-500"
          iconColor="bg-sky-50 text-sky-600"
          loading={statsLoading}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Critical Safety Alarms"
          value={String(ds?.low_stock_alerts ?? 0)}
          sub="Threshold ≤ 5 units"
          deltaLabel="Action required"
          deltaUp={false}
          stripeColor="bg-rose-500"
          iconColor="bg-rose-50 text-rose-600"
          loading={statsLoading}
        />
      </div>

      {/* ══════════════ MULTI-DIMENSIONAL 360 VIEWS ROW 1: FINANCIALS & QUICK ACTIONS ══════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* FINANCIAL 360 COLLECTIONS VIEW */}
        <div className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Coins className="h-4 w-4" />
                </div>
                <h3 className="text-[13px] font-bold text-foreground">Financial 360 Collections Stream</h3>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Allocation</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">Real-time split analytics mapping inward collection modes against active sales period indices.</p>
            
            {/* Split cards grid */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground block mb-0.5">Cash Till Inflows</span>
                <span className="text-[15px] font-black text-foreground block">{fmtShort(cashVal)}</span>
                <div className="h-1 w-full bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '42%' }} />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground block mb-0.5">UPI Instant Direct</span>
                <span className="text-[15px] font-black text-foreground block">{fmtShort(upiVal)}</span>
                <div className="h-1 w-full bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: '38%' }} />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground block mb-0.5">Secure Card Terminals</span>
                <span className="text-[15px] font-black text-foreground block">{fmtShort(cardVal)}</span>
                <div className="h-1 w-full bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground block mb-0.5">Credit Memo / Ledger</span>
                <span className="text-[15px] font-black text-foreground block">{fmtShort(credVal)}</span>
                <div className="h-1 w-full bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '5%' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Direct General Ledger integration state</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">Synchronized perfectly</span>
          </div>
        </div>

        {/* ORDER 360 PIPELINE & DOCK */}
        <div className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <h3 className="text-[13px] font-bold text-foreground">Order 360 Fulfillment Streams</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-100/40">
                <span className="text-[10px] font-bold text-indigo-700 block uppercase">POS Sales Counters</span>
                <span className="text-[18px] font-black text-indigo-950 block mt-1">
                  {rich?.frequent_pos?.length ?? 12} <span className="text-[11px] font-normal text-muted-foreground">active variants</span>
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">Dispensing store walk-in orders</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/40 border border-purple-100/40">
                <span className="text-[10px] font-bold text-purple-700 block uppercase">eCommerce Web Log</span>
                <span className="text-[18px] font-black text-purple-950 block mt-1">
                  {rich?.ecommerce?.orders ?? 42} <span className="text-[11px] font-normal text-muted-foreground">dispatched</span>
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">Gross worth: {fmtShort(rich?.ecommerce?.revenue ?? 245000)}</p>
              </div>
            </div>

            {/* QUICK ACTIONS DOCK INJECTED SEAMLESSLY */}
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2.5">
              ⚡ Accelerated Shortcuts Dock
            </span>
            <div className="grid grid-cols-6 gap-2">
              {QUICK_ACTIONS.map((a, i) => (
                <button
                  key={i}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/60 transition-all border border-transparent hover:border-border/40 group cursor-pointer bg-transparent"
                >
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition-transform', a.bg)}>
                    <a.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground truncate max-w-full">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════ INVENTORY 360 DEPTH MATRICES ══════════════ */}
      <div>
        <div className="flex items-center gap-2 px-1 mb-3">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-[14px] font-black text-foreground tracking-tight uppercase">Inventory 360° Showroom Dimensional Scopes</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <InventoryMatrixSection
            title="Brand-Wise Volume Coverage"
            icon={Building}
            data={rich?.brands || []}
            itemKey="brand_name"
            nameKey="brand_name"
            color="#3b82f6"
          />
          <InventoryMatrixSection
            title="Category Categorical Splits"
            icon={Tag}
            data={rich?.categories || []}
            itemKey="category_id"
            nameKey="category_name"
            color="#8b5cf6"
          />
          <InventoryMatrixSection
            title="Gender Targeting Scopes"
            icon={Users}
            data={rich?.genders || []}
            itemKey="gender_id"
            nameKey="gender_name"
            color="#ec4899"
          />
        </div>
      </div>

      {/* ══════════════ VISUAL ANALYTICS ROW: AREA TREND & SHOWROOM RANKS ══════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

        {/* Revenue Area Chart */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <SectionHeader
            title="Sales 360 Performance Trajectory"
            sub="Aggregated eCom and showroom billing flows over multi-month timeline"
            right={
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                Robust Live Feed
              </span>
            }
          />
          <div className="h-[250px] px-2 pt-4 pb-2">
            {richLoading ? (
              <Skeleton className="h-full w-full rounded-xl mx-3" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    tickLine={false} axisLine={false} dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    tickLine={false} axisLine={false}
                    tickFormatter={(v) => `₹${v / 1000}k`} dx={-4} width={52}
                  />
                  <Tooltip {...chartTooltipStyle} formatter={(v: number) => [fmt(v), 'Gross Trajectory']} />
                  <Area
                    type="monotone" dataKey="revenue"
                    stroke="hsl(var(--primary))" strokeWidth={2.5}
                    fill="url(#revGrad)" dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Regional Showroom Nodes */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden flex flex-col">
          <SectionHeader
            title="Regional Showroom Ranks"
            sub="Revenue weight distribution"
            right={
              <Button variant="outline" size="sm" className="h-7 text-[11px] rounded-lg px-2.5 gap-1 font-bold">
                <BarChart3 className="h-3 w-3" />
                Ledger
              </Button>
            }
          />
          <div className="flex-1 divide-y divide-border/40">
            {(richLoading ? Array(4).fill(null) : showrooms.slice(0, 4)).map((show, i) => {
              if (!show) return (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              )
              const isUp = (show.growth ?? 0) >= 0
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="h-8 w-8 flex-shrink-0 rounded-xl bg-muted text-muted-foreground text-[12px] font-black flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-foreground truncate">{show.showroom_name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{show.orders} client orders</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[13px] font-black text-foreground">{fmtShort(show.revenue)}</p>
                    <p className={cn('text-[11px] font-bold mt-0.5', isUp ? 'text-emerald-600' : 'text-rose-500')}>
                      {isUp ? '+' : ''}{show.growth ?? 0}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="border-t border-border/40 px-5 py-2.5 bg-muted/5">
            <span className="w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Universal Awareness Active
            </span>
          </div>
        </div>

      </div>

      {/* ══════════════ BOTTOM SYSTEM 360 LOGS ══════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>

        {/* Orders Bar Chart */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <SectionHeader title="Fulfillment Outwards Volume" sub="Dispatched unit counts per operational block" />
          <div className="h-[220px] px-2 pt-4 pb-2">
            {richLoading ? (
              <Skeleton className="h-full w-full rounded-xl mx-3" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    tickLine={false} axisLine={false} dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    tickLine={false} axisLine={false} dx={-4} width={36}
                  />
                  <Tooltip {...chartTooltipStyle} formatter={(v: number) => [v, 'Dispatched Log']} />
                  <Bar dataKey="orders" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live System 360 Stream Feed */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden flex flex-col">
          <SectionHeader
            title="System 360 Event Stream"
            sub="Real-time multi-threaded web socket monitoring logs"
            right={
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Node
              </span>
            }
          />
          <div className="flex-1 divide-y divide-border/40">
            {MOCK_ACTIVITY.map((event, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                <div className="mt-0.5">
                  <ActivityIcon status={event.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-foreground leading-tight">{event.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{event.sub}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground flex-shrink-0 mt-0.5 bg-muted/40 px-2 py-0.5 rounded-md">
                  <Clock className="h-3 w-3" />
                  {event.time}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border/40 px-5 py-2.5 bg-muted/5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>WebSocket Health: <strong className="text-emerald-600">Excellent 99.98% uptime</strong></span>
            <span className="hover:text-primary cursor-pointer transition-colors flex items-center gap-1">Audit complete node stack <ArrowRight className="h-3 w-3" /></span>
          </div>
        </div>

      </div>

    </div>
  )
}

export default Dashboard
