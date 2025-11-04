import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogOut, MessageSquare, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "Come back soon!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold">ChatFlow</span>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Chat Interfaces</h1>
          <p className="text-muted-foreground">
            Manage and create beautiful chat experiences for your n8n workflows
          </p>
        </div>

        {/* Create New Button */}
        <Card className="mb-8 border-dashed border-2 border-primary/30 bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="flex items-center justify-center py-12">
            <Button size="lg" className="bg-primary hover:bg-primary-glow shadow-glow">
              <Plus className="mr-2 h-5 w-5" />
              Create New Chat Interface
            </Button>
          </CardContent>
        </Card>

        {/* Empty State - Will be replaced with actual chat instances */}
        <div className="text-center py-16">
          <div className="inline-flex h-16 w-16 rounded-full bg-primary/10 items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No chat interfaces yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first chat interface to get started
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="secondary">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
