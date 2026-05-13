import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  useStaff, 
  useCreateStaff, 
  useUpdateStaff, 
  useDeleteStaff,
  StaffMember 
} from '@/hooks/useStaff'
import { useShowrooms } from '@/hooks/useShowrooms'
import { useBusinessMe } from '@/hooks/useBusiness'
import { Skeleton } from "@/components/ui/skeleton"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  MoreHorizontal,
  Key,
  Ban,
  CheckCircle2,
  Lock,
  Search,
  Filter,
  Edit2,
  Trash2,
  UserX,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'

export const StaffManagement: React.FC = () => {
  const { data: business } = useBusinessMe()
  const { data: staff, isLoading } = useStaff(business?.business_id)
  const { data: showrooms } = useShowrooms(business?.business_id)
  
  const createMutation = useCreateStaff()
  const updateMutation = useUpdateStaff()
  const deleteMutation = useDeleteStaff()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingStaff, setEditingStaff] = React.useState<Partial<StaffMember> | null>(null)
  const [formData, setFormData] = React.useState<any>({})

  const handleOpenDialog = (member: Partial<StaffMember> | null = null) => {
    setEditingStaff(member)
    setFormData(member || { 
      role: 'Sales', 
      active_status: true,
      business_id: business?.business_id 
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success('Staff member deleted successfully')
      })
    }
  }

  const handleToggleStatus = (member: StaffMember) => {
    updateMutation.mutate({ 
      id: member.user_id, 
      active_status: !member.active_status 
    }, {
      onSuccess: () => toast.success(`Account ${member.active_status ? 'deactivated' : 'activated'} successfully`)
    })
  }

  const handleSave = () => {
    const mutationOptions = {
      onSuccess: () => {
        setIsDialogOpen(false)
        toast.success(`Staff account ${editingStaff ? 'updated' : 'created'} successfully!`)
      },
      onError: (err: any) => {
        const message = err.error || err.message || (typeof err === 'string' ? err : 'Operation failed')
        toast.error(message)
      }
    }

    if (editingStaff?.user_id) {
      updateMutation.mutate({ id: editingStaff.user_id, ...formData }, mutationOptions)
    } else {
      createMutation.mutate(formData, mutationOptions)
    }
  }

  const getRoleBadge = (role: string) => {
    const r = role?.toLowerCase()
    switch (r) {
      case 'admin':
        return <Badge className="bg-purple-500 hover:bg-purple-600 shadow-sm">Administrator</Badge>
      case 'manager':
      case 'showroom manager':
        return <Badge className="bg-blue-500 hover:bg-blue-600 shadow-sm">{role}</Badge>
      case 'warehouse staff':
        return <Badge className="bg-orange-500 hover:bg-orange-600 shadow-sm">Inventory</Badge>
      case 'marketing':
      case 'crm executive':
        return <Badge className="bg-pink-500 hover:bg-pink-600 shadow-sm">{role}</Badge>
      case 'optometrist':
        return <Badge className="bg-cyan-500 hover:bg-cyan-600 shadow-sm">Optometrist</Badge>
      case 'cashier':
      case 'sales':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-sm">{role}</Badge>
      default:
        return <Badge variant="secondary" className="shadow-sm">{role || 'Staff'}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-10">
      {/* Unified Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/60 rounded-2xl px-5 py-3">
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
          <div
            style={{
              display: 'flex', alignItems: 'center',
              background: 'hsl(var(--muted) / 0.5)',
              border: '1px solid hsl(var(--border) / 0.4)',
              borderRadius: '12px', transition: 'all 0.15s',
              width: '100%', maxWidth: '24rem',
            }}
            onFocus={e => {
              e.currentTarget.style.background = 'hsl(var(--background))'
              e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)'
              e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.08)'
            }}
            onBlur={e => {
              e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)'
              e.currentTarget.style.borderColor = 'hsl(var(--border) / 0.4)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '12px', flexShrink: 0 }}>
              <Search style={{ width: '14px', height: '14px', color: 'hsl(var(--muted-foreground) / 0.6)' }} />
            </span>
            <input
              type="text"
              placeholder="Search staff members..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                padding: '9px 10px', fontSize: '13px', fontWeight: 500,
                color: 'hsl(var(--foreground))', fontFamily: 'inherit',
              }}
              className="placeholder:text-muted-foreground/40"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 px-4 gap-2 rounded-xl border-border/60 text-foreground text-[12px] font-semibold">
            <Filter className="h-3.5 w-3.5" /> Filters
          </Button>
        </div>
        <Button onClick={() => handleOpenDialog()} className="h-9 px-5 gap-2 rounded-xl text-[12px] font-bold shadow-lg shadow-primary/20">
          <UserPlus className="h-4 w-4" /> Add Staff Member
        </Button>
      </div>


      <Card className="border-none shadow-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold py-4">Name & Contact</TableHead>
              <TableHead className="font-bold">Role</TableHead>
              <TableHead className="font-bold">Assigned Showroom</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Last Login</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                </TableRow>
              ))
            ) : (
              staff?.map((member) => (
                <TableRow key={member.user_id} className="hover:bg-muted/30 transition-colors group">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{member.name}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Mail className="h-2.5 w-2.5" /> {member.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(member.role)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <StoreIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {member.showroom_name || <span className="text-muted-foreground italic">Global/HQ</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.active_status ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-500 font-medium text-xs">
                        <Ban className="h-3.5 w-3.5" /> Suspended
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-48">
                        <DropdownMenuItem onClick={() => handleOpenDialog(member)} className="gap-2">
                          <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(member)} className="gap-2">
                          {member.active_status ? (
                            <><UserX className="h-3.5 w-3.5 text-amber-500" /> Deactivate Account</>
                          ) : (
                            <><UserCheck className="h-3.5 w-3.5 text-emerald-500" /> Activate Account</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(member.user_id)} 
                          className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary/5 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {editingStaff ? 'Update Permissions' : 'New Staff Account'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input 
                  value={formData.name || ''} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mobile Number</Label>
                <Input 
                  value={formData.mobile || ''} 
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                  placeholder="+91 00000 00000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <Input 
                type="email"
                disabled={!!editingStaff}
                value={formData.email || ''} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all disabled:opacity-50"
                placeholder="john@blinkopticals.com"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Access Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(val) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Admin">Administrator (System Wide)</SelectItem>
                    <SelectItem value="Manager">Regional Manager</SelectItem>
                    <SelectItem value="Showroom Manager">Showroom Manager</SelectItem>
                    <SelectItem value="Sales">Sales Executive</SelectItem>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                    <SelectItem value="Warehouse Staff">Inventory/Warehouse</SelectItem>
                    <SelectItem value="CRM Executive">CRM/Customer Support</SelectItem>
                    <SelectItem value="Marketing">Marketing Executive</SelectItem>
                    <SelectItem value="Optometrist">Optometrist (Clinic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Showroom</Label>
                <Select 
                  value={formData.showroom_id || 'null'} 
                  onValueChange={(val) => setFormData({ ...formData, showroom_id: val === 'null' ? null : val })}
                >
                  <SelectTrigger className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all">
                    <SelectValue placeholder="Select Showroom" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="null">Global (HQ / Admin Only)</SelectItem>
                    {showrooms?.map((s) => (
                      <SelectItem key={s.showroom_id} value={s.showroom_id}>{s.showroom_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!editingStaff && (
              <div className="space-y-2 border-t pt-6">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Lock className="h-3 w-3" /> Initial Password
                </Label>
                <Input 
                  type="password"
                  value={formData.password || ''} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                  placeholder="Min. 8 characters"
                />
                <p className="text-[10px] text-muted-foreground">Staff will be prompted to change this on first login.</p>
              </div>
            )}
          </div>
          <DialogFooter className="p-6 bg-muted/30 border-t">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl px-8 shadow-lg shadow-primary/20"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Processing...' : (editingStaff ? 'Update User' : 'Create Account')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Internal helper for icons to avoid extra imports in loop
const StoreIcon = ({ className }: { className?: string }) => <MapPin className={className} />
