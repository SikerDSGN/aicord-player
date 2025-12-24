import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import aicordLogo from "@/assets/aicord-logo.webp";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email("Neplatná emailová adresa").max(255, "Email je příliš dlouhý"),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků").max(128, "Heslo je příliš dlouhé"),
  fullName: z.string().trim().min(1, "Jméno je povinné").max(100, "Jméno je příliš dlouhé")
});

const signInSchema = z.object({
  email: z.string().trim().email("Neplatná emailová adresa").max(255, "Email je příliš dlouhý"),
  password: z.string().min(1, "Heslo je povinné")
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const result = signUpSchema.safeParse({ email, password, fullName });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: {
            full_name: result.data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast.success("Účet vytvořen! Čekejte na schválení adminem.");
      navigate("/pending");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) throw error;

      toast.success("Vítejte zpět!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-dark p-4">
      <Card className="w-full max-w-md border-border/50 shadow-elevated animate-scale-in">
        <CardHeader className="space-y-1 text-center">
          <img src={aicordLogo} alt="Aicord Logo" width="80" height="80" className="mx-auto h-16 md:h-20 w-auto mb-4 hover-scale" />
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary">
            Aicord PLAYER
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Soukromá streamovací platforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" className="transition-smooth">Přihlášení</TabsTrigger>
              <TabsTrigger value="signup" className="transition-smooth">Registrace</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="animate-fade-in-fast">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="vas@email.cz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Heslo</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="glow" className="w-full" disabled={loading}>
                  {loading ? "Přihlašování..." : "Přihlásit se"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="animate-fade-in-fast">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Celé jméno</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Jan Novák"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="vas@email.cz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Heslo</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" variant="glow" className="w-full" disabled={loading}>
                  {loading ? "Vytváření účtu..." : "Vytvořit účet"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
