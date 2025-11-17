import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Music } from "lucide-react";

export default function Pending() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-dark p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-card text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Waiting for Approval</CardTitle>
          <CardDescription>
            Your account is pending admin approval. You'll be able to access the music library once approved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <Music className="mx-auto mb-2 h-12 w-12 text-primary opacity-50" />
            <p className="text-sm text-muted-foreground">
              The admin will review your request shortly. Check back soon!
            </p>
          </div>
          <Button onClick={signOut} variant="outline" className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
