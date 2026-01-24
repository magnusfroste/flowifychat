import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageSquare, Zap, Share2, Code, Sparkles, ArrowRight, Menu, X, Cloud, Github, Globe } from "lucide-react";
import flowifyLogo from "@/assets/logo-concept-1-flowing-bubble.png";
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-24 sm:pb-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">The Beautiful Frontend for n8n AI Agents</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-primary bg-clip-text text-transparent">
              n8n Builds the Brain.
              <br />
              Flowify Creates the Face.
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              n8n's AI Agents are powerful—but their chat is built for developers, not customers.
              Flowify gives you the polished interface that ChatGPT, Claude, and Grok set the standard for.
            </p>

            {/* Comparison Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
                <span className="text-sm text-muted-foreground">n8n Native:</span>
                <span className="text-sm font-medium">Developer-focused</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <span className="text-sm text-primary">+ Flowify:</span>
                <span className="text-sm font-medium text-primary">Customer-ready</span>
              </div>
            </div>

            {/* Value Props */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
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
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary-glow shadow-glow transition-all">
                  Start Free in Cloud
                  <Cloud className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="secondary">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Logo Column */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={flowifyLogo} alt="Flowify" className="h-8 w-8" />
                <span className="text-lg font-bold">Flowify</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Beautiful chat interfaces for your n8n workflows
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Deploy
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Flowify. All rights reserved.
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
