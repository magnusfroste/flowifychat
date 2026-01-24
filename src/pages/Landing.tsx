import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageSquare, Zap, Share2, Code, Sparkles, ArrowRight, Menu, X, Cloud, Github, Globe } from "lucide-react";
import flowifyLogo from "@/assets/flowify-logo-2026.png";
import { useState } from "react";

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="light min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src={flowifyLogo} alt="Flowify" className="h-8 w-8" />
              <span className="text-lg font-bold">Flowify</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Deploy
              </Link>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link to="/auth">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#features"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <Link
                to="/pricing"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Deploy
              </Link>
              <Link
                to="/auth"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full" size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-center">
        {/* Animated gradient background */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 animate-gradient-shift"
          style={{ backgroundSize: "200% 200%" }}
        />
        
        {/* Floating bubbles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large bubble - top left */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          
          {/* Medium bubble - top right */}
          <div className="absolute top-10 right-10 w-48 h-48 bg-accent/15 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: "1s" }} />
          
          {/* Small bubble - center left */}
          <div className="absolute top-1/3 left-10 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-float" style={{ animationDelay: "2s" }} />
          
          {/* Large bubble - bottom right */}
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-slower" />
          
          {/* Medium bubble - bottom left */}
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-primary/15 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: "3s" }} />
          
          {/* Small accent bubbles */}
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-accent/20 rounded-full blur-xl animate-pulse-glow" />
          <div className="absolute top-20 left-1/3 w-16 h-16 bg-primary/25 rounded-full blur-lg animate-pulse-glow" style={{ animationDelay: "2s" }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-24 sm:pb-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm text-primary font-medium">Let it Flowify</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-primary bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: "0.1s" }}>
              n8n Builds the Brain.
              <br />
              Flowify Creates the Face.
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Instantly launch ChatGPT, Claude, and Grok-inspired chat interfaces for your n8n AI agents.
              Beautiful. Fast. Free.
            </p>

            {/* Comparison Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border backdrop-blur-sm">
                <span className="text-sm text-muted-foreground">n8n Native:</span>
                <span className="text-sm font-medium">Developer-focused</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm">
                <span className="text-sm text-primary">+ Flowify:</span>
                <span className="text-sm font-medium text-primary">Customer-ready</span>
              </div>
            </div>

            {/* Value Props */}
            <div className="flex flex-wrap justify-center gap-6 mb-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cloud className="h-5 w-5 text-primary" />
                <span>Free Cloud Hosting</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Github className="h-5 w-5 text-primary" />
                <span>Open Source</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-5 w-5 text-primary" />
                <span>Self-Host for Custom Domains</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary-glow shadow-glow transition-all hover:scale-105">
                  Start Free in Cloud
                  <Cloud className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="https://github.com/magnusfroste/flowifychat" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="secondary" className="hover:scale-105 transition-transform">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need, Nothing You Don't
          </h2>
          <p className="text-xl text-muted-foreground">
            Purpose-built for n8n users who want stunning chat experiences
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<MessageSquare className="h-6 w-6" />}
            title="Modern Chat UI"
            description="ChatGPT-quality interfaces that your users will love. Streaming responses, markdown, and more."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Instant Setup"
            description="Paste your n8n webhook URL. Customize the look. Share the link. That's it."
          />
          <FeatureCard
            icon={<Share2 className="h-6 w-6" />}
            title="Shareable Links"
            description="Get a beautiful URL for each chat instance. Embed anywhere or share directly."
          />
          <FeatureCard
            icon={<Code className="h-6 w-6" />}
            title="Multi-Tenant"
            description="Manage unlimited chat interfaces. Perfect for agencies and power users."
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="Customizable"
            description="Brand colors, avatars, welcome messages. Make it yours without code."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Real-time"
            description="Streaming responses. Typing indicators. Everything your users expect."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative rounded-3xl bg-gradient-primary p-12 shadow-elegant overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5" />
          
          <div className="relative text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Deploy Beautiful Chats?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join n8n flowgrammers who've stopped rebuilding the same chat UI over and over.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="shadow-lg">
                Start Building Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo & Open Source Badge */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <Link to="/" className="flex items-center gap-2">
                <img src={flowifyLogo} alt="Flowify" className="h-8 w-8" />
                <span className="text-lg font-bold">Flowify</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  Open Source
                </span>
                <span className="text-sm text-muted-foreground">Let it Flowify</span>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a 
                href="https://github.com/magnusfroste/flowifychat" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a 
                href="#features" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <Link 
                to="/pricing" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Deploy
              </Link>
              <Link 
                to="/terms" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link 
                to="/privacy" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Flowify. Open Source under MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-glow">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Landing;
