import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, User } from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "listener" | "pending";
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          created_at,
          user_roles (role)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const usersWithRoles = data.map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.user_roles?.[0]?.role || "pending",
        created_at: user.created_at,
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: "admin" | "listener" | "pending") => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("User role updated successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to update user role");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        User Management
      </h1>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="border-border bg-card">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  {user.role === "admin" ? (
                    <Shield className="h-6 w-6 text-primary" />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{user.full_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Select
                  value={user.role}
                  onValueChange={(value: "admin" | "listener" | "pending") =>
                    updateUserRole(user.id, value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="listener">Listener</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
