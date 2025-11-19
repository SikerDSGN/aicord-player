import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Download, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Instalovat Aicord</CardTitle>
          <CardDescription>
            Nainstaluj si aplikaci na telefon pro nejlepší zážitek
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Aplikace je nainstalovaná! 🎉</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Najdeš ji na své ploše nebo v menu aplikací.
                </p>
                <Button onClick={() => navigate("/")} className="w-full">
                  Zpět do aplikace
                </Button>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Výhody instalace:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Rychlý přístup z plochy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Funguje offline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Plnohodnotný zážitek jako nativní aplikace</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Bez reklam a rozptylování prohlížeče</span>
                  </li>
                </ul>
              </div>
              
              <Button onClick={handleInstallClick} className="w-full" size="lg">
                <Download className="h-5 w-5 mr-2" />
                Instalovat nyní
              </Button>
              
              <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
                Možná později
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Jak nainstalovat:</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium mb-1">📱 Na iPhone:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
                      <li>Otevři tuto stránku v Safari</li>
                      <li>Klikni na tlačítko Sdílet (čtverec se šipkou)</li>
                      <li>Vyber "Přidat na plochu"</li>
                      <li>Potvrď "Přidat"</li>
                    </ol>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-1">🤖 Na Androidu:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
                      <li>Otevři menu prohlížeče (tři tečky)</li>
                      <li>Vyber "Přidat na plochu" nebo "Instalovat aplikaci"</li>
                      <li>Potvrď instalaci</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Zpět do aplikace
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
