import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../../App";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Users, Loader2, Search, Edit, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, {
        withCredentials: true
      });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setSaving(true);
    
    try {
      await axios.put(`${API}/admin/users/${editUser.user_id}`, {
        subscription_tier: editUser.subscription_tier,
        monthly_credits: editUser.monthly_credits,
        credits_used: editUser.credits_used
      }, { withCredentials: true });
      
      toast.success("User updated!");
      setEditUser(null);
      await fetchUsers();
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setSaving(true);
    
    try {
      await axios.delete(`${API}/admin/users/${deleteUser.user_id}`, {
        withCredentials: true
      });
      
      toast.success("User deleted!");
      setDeleteUser(null);
      await fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tierColors = {
    free: "bg-slate-500/10 text-slate-500",
    pro: "bg-primary/10 text-primary",
    premium: "bg-secondary/10 text-secondary"
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="admin-users">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-2 flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                User Management
              </h1>
              <p className="text-muted-foreground">{total} total users</p>
            </div>
          </div>

          {/* Search */}
          <Card className="rounded-3xl border-border/50 mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl"
                  data-testid="user-search"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="rounded-3xl border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id} data-testid={`user-row-${user.user_id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0055] to-[#7000FF] flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-full ${tierColors[user.subscription_tier] || tierColors.free}`}>
                        {user.subscription_tier?.charAt(0).toUpperCase() + user.subscription_tier?.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{user.credits_used}</span>
                      <span className="text-muted-foreground"> / {user.monthly_credits}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditUser({ ...user })}
                          className="rounded-xl"
                          data-testid={`edit-user-${user.user_id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteUser(user)}
                          className="rounded-xl text-destructive hover:text-destructive"
                          data-testid={`delete-user-${user.user_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
            <DialogContent className="rounded-3xl" data-testid="edit-user-dialog">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user subscription and credits
                </DialogDescription>
              </DialogHeader>
              {editUser && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={editUser.email} disabled className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Subscription Tier</Label>
                    <Select
                      value={editUser.subscription_tier}
                      onValueChange={(value) => setEditUser({ ...editUser, subscription_tier: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Monthly Credits</Label>
                      <Input
                        type="number"
                        value={editUser.monthly_credits}
                        onChange={(e) => setEditUser({ ...editUser, monthly_credits: parseInt(e.target.value) || 0 })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credits Used</Label>
                      <Input
                        type="number"
                        value={editUser.credits_used}
                        onChange={(e) => setEditUser({ ...editUser, credits_used: parseInt(e.target.value) || 0 })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUser(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateUser}
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-[#FF0055] to-[#7000FF] text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete User Dialog */}
          <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
            <DialogContent className="rounded-3xl" data-testid="delete-user-dialog">
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this user? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {deleteUser && (
                <div className="py-4">
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="font-medium">{deleteUser.name}</p>
                    <p className="text-sm text-muted-foreground">{deleteUser.email}</p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteUser(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={saving}
                  className="rounded-xl"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
