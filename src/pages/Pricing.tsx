import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft, Cloud, Server, Github } from "lucide-react";
import flowifyLogo from "@/assets/logo-concept-1-flowing-bubble.png";
import { Link } from "react-router-dom";

const Pricing = () => {
  const deploymentOptions = [
    {
      name: "Cloud",
      icon: <Cloud className="h-8 w-8" />,
      price: "Free",
      description: "Use Flowify hosted in the cloud — no setup required",
      features: [
        "Unlimited chat instances",
        "Custom branding (colors, logo, messages)",
        "Public & authenticated chat modes",
        "Conversation history",
        "Analytics dashboard",
        "Instant setup",
      ],
      cta: "Get Started Free",
      href: "/auth",
      highlighted: true,
    },
    {
      name: "Self-Hosted",
      icon: <Server className="h-8 w-8" />,
      price: "Free",
      description: "Host on your own infrastructure with custom domains",
      features: [
        "Everything in Cloud",
        "Custom domain support",
        "Full data ownership",
        "Use your own Supabase",
        "Complete source code access",
        "No usage limits",
      ],
      cta: "View on GitHub",
      href: "https://github.com",
      highlighted: false,
      external: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <img src={flowifyLogo} alt="Flowify" className="h-8 w-8" />
                <span className="text-xl font-bold">Flowify</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Free to Use, Anywhere
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Flowify is completely free. Use our cloud or self-host for custom domains.
          </p>
        </div>

        {/* Deployment Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {deploymentOptions.map((option) => (
            <Card
              key={option.name}
              className={`relative ${
                option.highlighted
                  ? "border-primary border-2 shadow-glow"
                  : "border-border"
              }`}
            >
              <CardHeader className="text-center pb-8 pt-6">
                <div className="flex justify-center mb-4 text-primary">
                  {option.icon}
                </div>
                <CardTitle className="text-2xl mb-2">{option.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{option.price}</span>
                </div>
                <CardDescription className="text-base">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {option.external ? (
                  <Button asChild variant="outline" className="w-full">
                    <a href={option.href} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      {option.cta}
                    </a>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link to={option.href}>{option.cta}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Self-Hosting Guide */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Self-Hosting Guide
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">1. Clone the Repository</h3>
              <p className="text-muted-foreground">
                Download the source code from GitHub and install dependencies with <code className="bg-muted px-1 rounded">npm install</code>.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">2. Set Up Supabase (Free Tier)</h3>
              <p className="text-muted-foreground">
                Create a free Supabase project and run the provided migrations. Update your environment variables.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">3. Deploy Anywhere</h3>
              <p className="text-muted-foreground">
                Deploy to Vercel, Netlify, or your own server. Configure your custom domain in your hosting provider.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 pt-16 border-t border-border">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create beautiful chat experiences for your n8n workflows in minutes.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary-glow">
            <Link to="/auth">Start Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
