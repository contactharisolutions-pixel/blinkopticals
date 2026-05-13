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
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useShowrooms, useCreateShowroom, useUpdateShowroom } from '@/hooks/useShowrooms'
import { useBusinessMe } from '@/hooks/useBusiness'
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Store, 
  Plus, 
  MoreHorizontal, 
  MapPin, 
  Phone, 
  User as UserIcon,
  Search,
  LayoutGrid,
  List,
  Mail,
  Building
} from 'lucide-react'
import { Showroom } from '@/types'
import { cn } from '@/lib/utils'

import { toast } from 'sonner'

export const ShowroomManagement: React.FC = () => {
  const { data: business } = useBusinessMe()
  const { data: showrooms, isLoading } = useShowrooms(business?.business_id)
  const createMutation = useCreateShowroom()
  const updateMutation = useUpdateShowroom()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingShowroom, setEditingShowroom] = React.useState<Partial<Showroom> | null>(null)
  const [formData, setFormData] = React.useState<Partial<Showroom>>({})
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid')

  const handleOpenDialog = (showroom: Partial<Showroom> | null = null) => {
    setEditingShowroom(showroom)
    setFormData(showroom || { business_id: business?.business_id, active_status: true })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    const mutationOptions = {
      onSuccess: () => {
        setIsDialogOpen(false)
        toast.success(`Showroom ${editingShowroom ? 'updated' : 'created'} successfully!`)
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to save showroom')
      }
    }

    if (editingShowroom?.showroom_id) {
      updateMutation.mutate(formData as any, mutationOptions)
    } else {
      createMutation.mutate(formData, mutationOptions)
    }
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-10">
      {/* Unified Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/60 rounded-2xl px-5 py-3">
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
            placeholder="Search showrooms..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              padding: '9px 10px', fontSize: '13px', fontWeight: 500,
              color: 'hsl(var(--foreground))', fontFamily: 'inherit',
            }}
            className="placeholder:text-muted-foreground/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-muted/30 p-1 rounded-xl flex items-center gap-1 border border-border/40">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8 rounded-lg"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8 rounded-lg"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-px h-6 bg-border mx-1" />
          <Button onClick={() => handleOpenDialog()} className="h-9 px-5 gap-2 rounded-xl text-[12px] font-bold shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Add Showroom
          </Button>
        </div>
      </div>


      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {showrooms?.map((showroom) => (
            <Card key={showroom.showroom_id} className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className={cn(
                "pb-4 flex flex-row items-start justify-between bg-primary/5 border-b transition-colors group-hover:bg-primary/10",
                !showroom.active_status && "bg-muted/50 opacity-60"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">{showroom.showroom_name}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {showroom.city}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => handleOpenDialog(showroom)}>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem>View Inventory</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Manager</p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <UserIcon className="h-3 w-3 opacity-50" />
                      {showroom.manager_name || 'Not assigned'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contact</p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-3 w-3 opacity-50" />
                      {showroom.contact_number || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-dashed">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                      {showroom.staff_count || 0} Staff
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-500/5 border-emerald-500/20 text-emerald-600">
                      {showroom.total_stock || 0} Stock
                    </Badge>
                  </div>
                  {showroom.active_status ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Showroom Name</TableHead>
                <TableHead className="font-bold">Location</TableHead>
                <TableHead className="font-bold">Manager</TableHead>
                <TableHead className="font-bold">Contact</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showrooms?.map((showroom) => (
                <TableRow key={showroom.showroom_id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{showroom.showroom_name}</TableCell>
                  <TableCell>{showroom.city}</TableCell>
                  <TableCell>{showroom.manager_name}</TableCell>
                  <TableCell>{showroom.contact_number}</TableCell>
                  <TableCell>
                    {showroom.active_status ? (
                      <Badge className="bg-emerald-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(showroom)}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary/5 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {editingShowroom ? 'Edit Showroom' : 'Add New Showroom'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Building className="h-3 w-3" /> Showroom Name
                </Label>
                <Input 
                  value={formData.showroom_name || ''} 
                  onChange={(e) => setFormData({ ...formData, showroom_name: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <UserIcon className="h-3 w-3" /> Manager Name
                </Label>
                <Input 
                  value={formData.manager_name || ''} 
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Full Address
              </Label>
              <Input 
                value={formData.address || ''} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> City
                </Label>
                <Input 
                  value={formData.city || ''} 
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                  placeholder="e.g. Surat"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> State
                </Label>
                <Input 
                  value={formData.state || ''} 
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                  placeholder="e.g. Gujarat"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> Pincode
                </Label>
                <Input 
                  value={formData.pincode || ''} 
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                  placeholder="395001"
                />
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2"><Phone className="h-3 w-3" /> Contact Numbers</span>
                  <span className="text-[10px] text-muted-foreground/70 normal-case font-normal">Add comma for multiple</span>
                </Label>
                <Input 
                  value={formData.contact_number || ''} 
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                  placeholder="e.g. +91 9876543210, +91 8866222777"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Phone className="h-3 w-3" /> Secondary Contact
                </Label>
                <Input 
                  value={formData.secondary_contact || ''} 
                  onChange={(e) => setFormData({ ...formData, secondary_contact: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                  placeholder="Additional alternative lines"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Google Map Location Link
              </Label>
              <Input 
                value={formData.google_maps_link || ''} 
                onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
                className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all font-mono text-xs"
                placeholder="https://maps.google.com/?q=..."
              />
              <p className="text-[10px] text-muted-foreground">Attached dynamically to web layout footers and contact route directories.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 border-t pt-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Email Address
                </Label>
                <Input 
                  type="email"
                  value={formData.email || ''} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GSTIN (Optional)</Label>
                <Input 
                  value={formData.gstin || ''} 
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  className="rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/30 border-t">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl px-8 shadow-lg shadow-primary/20"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Showroom'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
