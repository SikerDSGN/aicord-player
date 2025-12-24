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
import { getSafeError } from "@/lib/auth-errors";

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
      // First get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Profiles error:", profilesError);
        throw profilesError;
      }

      // Then get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Roles error:", rolesError);
        throw rolesError;
      }

      // Combine the data
      const usersWithRoles = profilesData.map((profile) => {
        const userRole = rolesData?.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: (userRole?.role || "pending") as "admin" | "listener" | "pending",
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error: unknown) {
      toast.error(getSafeError(error, "Nepodařilo se načíst uživatele"));
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

      toast.success("Role uživatele úspěšně aktualizována");
      fetchUsers();
    } catch (error: any) {
      toast.error("Nepodařilo se aktualizovat roli uživatele");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="container py-6 md:py-8 px-4">
        <p className="text-center text-muted-foreground">Načítání uživatelů...</p>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-8 px-4">
      <h1 className="mb-4 md:mb-6 text-2xl md:text-3xl font-bold text-foreground">
        Správa uživatelů
      </h1>

      <div className="grid gap-3 md:gap-4">
        {users.map((user) => (
          <Card key={user.id} className="border-border bg-card">
            <CardContent className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-muted flex-shrink-0">
                  {user.role === "admin" ? (
                    <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  ) : (
                    <User className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm md:text-base truncate">{user.full_name || "Neznámý"}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Připojeno {new Date(user.created_at).toLocaleDateString('cs-CZ')}
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
                    <SelectItem value="pending">Čeká</SelectItem>
                    <SelectItem value="listener">Posluchač</SelectItem>
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
