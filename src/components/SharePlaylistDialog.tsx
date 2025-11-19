import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface SharePlaylistDialogProps {
  playlistId: string;
  playlistName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SharePlaylistDialog({ 
  playlistId, 
  playlistName, 
  open, 
  onOpenChange 
}: SharePlaylistDialogProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/playlist/${playlistId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link zkopírován do schránky");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Nepodařilo se zkopírovat link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Sdílet playlist
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Sdílej tento playlist s ostatními pomocí tohoto odkazu:
            </p>
            <p className="font-semibold text-foreground mb-4">{playlistName}</p>
          </div>
          
          <div className="flex gap-2">
            <Input 
              value={shareUrl} 
              readOnly 
              className="flex-1 bg-muted/50"
            />
            <Button 
              onClick={handleCopy} 
              size="icon"
              variant={copied ? "default" : "outline"}
              className={copied ? "bg-gradient-primary" : ""}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            <p>💡 Tip: Kdokoliv s tímto odkazem může playlist zobrazit</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
