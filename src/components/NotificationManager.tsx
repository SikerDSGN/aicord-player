import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function NotificationManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !("Notification" in window)) return;

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          toast.success("Notifikace povoleny");
        }
      });
    }

    // Subscribe to new songs
    const channel = supabase
      .channel("songs-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "songs",
        },
        (payload) => {
          const newSong = payload.new as any;
          
          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification("Nová skladba přidána! 🎵", {
              body: `${newSong.title} - ${newSong.artist}`,
              icon: newSong.cover_url || "/aicord-logo.png",
              badge: "/aicord-logo.png",
            });
          }

          // Show in-app toast
          toast.success(`Nová skladba: ${newSong.title}`, {
            description: newSong.artist,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}
