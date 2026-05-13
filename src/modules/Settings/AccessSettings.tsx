import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Lock, 
  ShieldAlert, 
  Fingerprint, 
  Save, 
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { cn } from "@/lib/utils"

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard Access', group: 'General' },
  { id: 'pos', label: 'POS / Billing', group: 'Sales' },
  { id: 'orders', label: 'Order Management', group: 'Sales' },
  { id: 'customers', label: 'Customer Records', group: 'Customers' },
  { id: 'crm', label: 'CRM & Leads', group: 'Customers' },
  { id: 'inventory', label: 'Inventory Full', group: 'Catalog' },
  { id: 'products', label: 'Product Catalog', group: 'Catalog' },
  { id: 'ecommerce', label: 'Ecommerce Hub', group: 'Catalog' },
  { id: 'reports', label: 'Analytics & Reports', group: 'Finance' },
  { id: 'accounting', label: 'Financial Accounts', group: 'Finance' },
  { id: 'staff', label: 'Staff Management', group: 'Enterprise' },
  { id: 'showrooms', label: 'Branch Management', group: 'Enterprise' },
  { id: 'settings', label: 'System Settings', group: 'Enterprise' }
]

export const AccessSettings: React.FC = () => {
  const [roles, setRoles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedRole, setSelectedRole] = React.useState<any>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/access/roles')
      if (data.success) setRoles(data.data)
    } catch (err) {
      toast.error('Failed to load access roles')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchRoles()
  }, [])

  const handleSave = async () => {
    if (!selectedRole.role_name) return toast.error('Role name is required')
    
    try {
      const url = selectedRole.role_id ? `/api/access/roles/${selectedRole.role_id}` : '/api/access/roles'
      const method = selectedRole.role_id ? 'put' : 'post'
      
      const { data } = await axios[method](url, selectedRole)
      if (data.success) {
        toast.success(selectedRole.role_id ? 'Role updated' : 'Custom role created')
        fetchRoles()
        setIsEditing(false)
        setSelectedRole(null)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save role')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role? Users assigned to this role will lose access.')) return
    try {
      await axios.delete(`/api/access/roles/${id}`)
      toast.success('Role removed')
      fetchRoles()
      if (selectedRole?.role_id === id) setSelectedRole(null)
    } catch (err) {
      toast.error('Failed to delete role')
    }
  }

  const togglePermission = (permId: string) => {
    const currentPerms = Array.isArray(selectedRole.permissions) 
      ? selectedRole.permissions 
      : JSON.parse(selectedRole.permissions || '[]')
    
    const newPerms = currentPerms.includes(permId)
      ? currentPerms.filter((p: string) => p !== permId)
      : [...currentPerms, permId]
    
    setSelectedRole({ ...selectedRole, permissions: newPerms })
  }

  const filteredRoles = roles.filter(r => 
    r.role_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && roles.length === 0) return <Skeleton className="h-[600px] w-full rounded-2xl" />

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-10">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3">
        <div>
          <p className="text-[14px] font-bold text-foreground">Access Control (RBAC)</p>
          <p className="text-[12px] text-muted-foreground">Manage enterprise roles and granular permissions</p>
        </div>
        {!isEditing && (
          <Button size="sm" onClick={() => {
            setSelectedRole({ role_name: '', permissions: [], is_system: false })
            setIsEditing(true)
          }} className="h-9 px-4 gap-1.5 rounded-xl text-[12px] font-semibold">
            <Plus className="h-3.5 w-3.5" /> Create Role
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Role List */}
        <div className={cn("lg:col-span-4 space-y-6", isEditing && "hidden lg:block")}>
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/50 border-b p-4">
             <div
               style={{
                 display: 'flex', alignItems: 'center',
                 background: 'hsl(var(--background))',
                 border: '1px solid hsl(var(--border) / 0.4)',
                 borderRadius: '10px', transition: 'all 0.15s',
               }}
               onFocus={e => {
                 e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)'
                 e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.08)'
               }}
               onBlur={e => {
                 e.currentTarget.style.borderColor = 'hsl(var(--border) / 0.4)'
                 e.currentTarget.style.boxShadow = 'none'
               }}
             >
               <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px', flexShrink: 0 }}>
                 <Search style={{ width: '13px', height: '13px', color: 'hsl(var(--muted-foreground) / 0.6)' }} />
               </span>
               <input
                 type="text"
                 placeholder="Search roles..."
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 style={{
                   flex: 1, background: 'transparent', border: 'none', outline: 'none',
                   padding: '7px 8px', fontSize: '12px', fontWeight: 500,
                   color: 'hsl(var(--foreground))', fontFamily: 'inherit',
                 }}
                 className="placeholder:text-muted-foreground/40"
               />
             </div>
            </CardHeader>
            <CardContent className="p-2 max-h-[600px] overflow-y-auto">
               <div className="space-y-1">
                 {filteredRoles.map((role) => (
                   <div 
                     key={role.role_id}
                     onClick={() => {
                       setSelectedRole(role)
                       setIsEditing(true)
                     }}
                     className={cn(
                       "p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group",
                       selectedRole?.role_id === role.role_id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                     )}
                   >
                     <div className="flex items-center gap-3">
                       <div className={cn(
                         "p-2 rounded-lg",
                         selectedRole?.role_id === role.role_id ? "bg-white/20" : "bg-muted group-hover:bg-background"
                       )}>
                         {role.is_system ? <ShieldCheck className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                       </div>
                       <div>
                         <p className="text-sm font-bold">{role.role_name}</p>
                         <p className={cn(
                           "text-[10px] opacity-70",
                           selectedRole?.role_id === role.role_id ? "text-primary-foreground" : "text-muted-foreground"
                         )}>
                           {role.is_system ? 'System Protected' : 'Custom Entity Role'}
                         </p>
                       </div>
                     </div>
                     {role.is_system && <Badge variant="outline" className="text-[8px] uppercase border-white/20 text-white/80">Default</Badge>}
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Permission Editor */}
        <div className="lg:col-span-8">
          {isEditing && selectedRole ? (
             <Card className="border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
               <CardHeader className="bg-muted/50 border-b flex flex-row items-center justify-between p-6">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <ShieldAlert className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Role Matrix Editor</CardTitle>
                      <CardDescription>Configuring permissions for <span className="font-bold text-primary">{selectedRole.role_name || 'New Role'}</span></CardDescription>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" className="rounded-xl h-9 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="rounded-xl h-9 text-xs px-6 shadow-lg shadow-primary/20">
                      <Save className="h-3 w-3 mr-2" /> Save Role
                    </Button>
                 </div>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-widest font-black text-muted-foreground">Identity & Metadata</Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                       <div className="space-y-2">
                          <Label className="text-xs font-bold">Role Label</Label>
                          <Input 
                            value={selectedRole.role_name}
                            onChange={e => setSelectedRole({...selectedRole, role_name: e.target.value})}
                            disabled={selectedRole.is_system}
                            className="rounded-xl bg-muted/20 border-transparent focus:bg-background h-11"
                            placeholder="e.g. Inventory Manager"
                          />
                       </div>
                       <div className="flex items-end pb-1">
                          {!selectedRole.is_system && selectedRole.role_id && (
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDelete(selectedRole.role_id)}
                              className="rounded-xl gap-2 w-full h-11 border-none shadow-lg shadow-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" /> Terminate Role
                            </Button>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-xs uppercase tracking-widest font-black text-muted-foreground">Permission Matrix</Label>
                    
                    <div className="grid gap-6">
                       {['General', 'Sales', 'Customers', 'Catalog', 'Finance', 'Enterprise'].map(group => (
                         <div key={group} className="space-y-3">
                            <h4 className="text-[11px] font-bold text-primary flex items-center gap-2">
                               <div className="h-1 w-1 rounded-full bg-primary" /> {group} Module
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                               {AVAILABLE_PERMISSIONS.filter(p => p.group === group).map(perm => {
                                 const isChecked = (Array.isArray(selectedRole.permissions) ? selectedRole.permissions : JSON.parse(selectedRole.permissions || '[]')).includes(perm.id)
                                 return (
                                   <div 
                                      key={perm.id} 
                                      onClick={() => !selectedRole.is_system && togglePermission(perm.id)}
                                      className={cn(
                                        "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none",
                                        isChecked ? "border-primary/20 bg-primary/5" : "border-transparent bg-muted/20 hover:bg-muted/40",
                                        selectedRole.is_system && "cursor-not-allowed opacity-80"
                                      )}
                                   >
                                      <div className={cn(
                                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                        isChecked ? "bg-primary border-primary text-white" : "bg-background border-muted-foreground/20"
                                      )}>
                                        {isChecked && <CheckCircle2 className="h-3 w-3" />}
                                      </div>
                                      <span className="text-xs font-bold leading-none">{perm.label}</span>
                                   </div>
                                 )
                               })}
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  {selectedRole.is_system && (
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-4 animate-pulse">
                       <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                       <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                         <strong>System Protected Role:</strong> This role is essential for ERP stability. 
                         You can view its matrix but cannot modify its core identity or permissions. 
                         To create a variation, create a new <strong>Custom Role</strong>.
                       </p>
                    </div>
                  )}
               </CardContent>
             </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-6 text-center p-12 bg-muted/20 rounded-3xl border border-dashed">
               <div className="p-6 rounded-full bg-background shadow-xl">
                  <ShieldCheck className="h-12 w-12 text-primary/20" />
               </div>
               <div className="space-y-2 max-w-xs">
                  <h3 className="text-lg font-bold">Select an Access Role</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Choose a role from the left pane to audit its permissions or create a new custom role for specific staff requirements.
                  </p>
               </div>
               <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  <div className="p-4 rounded-2xl bg-background shadow-sm border space-y-2">
                     <Users className="h-5 w-5 text-indigo-500" />
                     <p className="text-[10px] font-bold">Identity First</p>
                     <p className="text-[9px] text-muted-foreground">Map users to roles with ease.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-background shadow-sm border space-y-2">
                     <Zap className="h-5 w-5 text-amber-500" />
                     <p className="text-[10px] font-bold">Live Sync</p>
                     <p className="text-[9px] text-muted-foreground">Permissions apply in real-time.</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Zap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4Z" />
    </svg>
  )
}
