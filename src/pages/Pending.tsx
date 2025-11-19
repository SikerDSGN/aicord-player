import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Music } from "lucide-react";
import aicordLogo from "@/assets/aicord-logo.png";

export default function Pending() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-dark p-4">
      <Card className="w-full max-w-md border-border/50 shadow-elevated animate-scale-in text-center">
        <CardHeader>
          <img src={aicordLogo} alt="Aicord Logo" className="mx-auto h-16 mb-4 hover-scale" />
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-glow-soft animate-pulse-glow">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Čekání na schválení
          </CardTitle>
          <CardDescription>
            Váš účet čeká na schválení adminem. Po schválení získáte přístup do hudební knihovny.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 border border-border/50 hover-lift">
            <Music className="mx-auto mb-2 h-12 w-12 text-primary opacity-50" />
            <p className="text-sm text-muted-foreground">
              Admin zkontroluje vaši žádost co nejdříve. Zkontrolujte to brzy!
            </p>
          </div>
          <Button onClick={signOut} variant="outline" className="w-full">
            Odhlásit se
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
