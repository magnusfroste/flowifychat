/**
 * Hook: Load and resolve a chat instance by UUID or slug
 * Handles auth gating, owner detection, and branding badge
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ChatInstance, AuthUser } from "@/types/chat";

interface UseChatInstanceResult {
  chatInstance: ChatInstance | null;
  chatInstances: ChatInstance[];
  user: AuthUser | null;
  isOwner: boolean;
  ownerHidesBranding: boolean;
  loading: boolean;
}

export function useChatInstance(id: string | undefined): UseChatInstanceResult {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [chatInstance, setChatInstance] = useState<ChatInstance | null>(null);
  const [chatInstances, setChatInstances] = useState<ChatInstance[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerHidesBranding, setOwnerHidesBranding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) setUser(session?.user ?? null);
      }
    );

    const load = async () => {
      if (!id) {
        navigate("/dashboard");
        return;
      }

      try {
        // Load all user's chats for admin sidebar
        const { data: { session: currentAuthSession } } = await supabase.auth.getSession();
        if (currentAuthSession?.user && isMounted) {
          const { data: allChats } = await supabase
            .from("chat_instances")
            .select("*")
            .eq("user_id", currentAuthSession.user.id)
            .order("created_at", { ascending: false });

          if (allChats && isMounted) {
            setChatInstances(allChats as unknown as ChatInstance[]);
          }
        }

        if (!isMounted) return;

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let data, error;

        if (isUUID) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`);
            return;
          }
          if (isMounted) setUser(session.user);

          const result = await supabase
            .from("chat_instances")
            .select("*")
            .eq("id", id)
            .eq("user_id", session.user.id)
            .single();
          data = result.data;
          error = result.error;
        } else {
          const result = await supabase
            .from("chat_instances_public")
            .select("*")
            .eq("slug", id)
            .single();
          data = result.data;
          error = result.error;
        }

        if (!isMounted) return;
        if (error) throw error;

        const instance = data as unknown as ChatInstance;
        setChatInstance(instance);

        // Public mode: skip session/user logic
        if (instance.chat_type === "public") {
          if (isMounted) setLoading(false);
          return;
        }

        // Authenticated mode: require login
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession) {
          navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        if (!isMounted) return;

        const userIsOwner = authSession.user.id === instance.user_id;
        if (isMounted) setIsOwner(userIsOwner);

        // Check branding badge visibility
        if (!userIsOwner && instance.user_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("hide_branding_badge")
            .eq("id", instance.user_id)
            .maybeSingle();
          if (isMounted) setOwnerHidesBranding(profileData?.hide_branding_badge || false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading chat instance:", error);
          toast({
            title: "Error",
            description: "Failed to load chat instance",
            variant: "destructive",
          });
          navigate("/dashboard");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [id, navigate, toast]);

  return { chatInstance, chatInstances, user, isOwner, ownerHidesBranding, loading };
}
