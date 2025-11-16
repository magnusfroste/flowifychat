import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import flowifyLogo from "@/assets/logo-concept-1-flowing-bubble.png";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createCheckoutSession } from "@/lib/stripe";
import { toast } from "sonner";

const Pricing = () => {
  const navigate = useNavigate();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgradeToPro = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please sign in to upgrade");
      navigate('/auth');
      return;
    }

    setIsUpgrading(true);
    try {
      await createCheckoutSession();
      toast.success("Redirecting to checkout...");
    } catch (error) {
      console.error("Error starting upgrade:", error);
      toast.error("Failed to start upgrade process");
    } finally {
      setIsUpgrading(false);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out Flowify",
      features: [
        "1 chat instance",
        "Custom branding (colors, logo, messages)",
        "Public share links",
        "Basic analytics",
        "Conversation history",
      ],
      limitations: [
        "Flowify branding badge visible",
      ],
      cta: "Get Started Free",
      ctaVariant: "outline" as const,
      highlighted: false,
      href: "/auth",
    },
    {
      name: "Pro",
      price: "$9",
      period: "per month",
      description: "For professionals who need more",
      features: [
        "Unlimited chat instances",
        "Hide branding badge (white-label)",
        "All Free features included",
        "Advanced analytics & export",
        "Priority support",
      ],
      cta: "Upgrade to Pro",
      ctaVariant: "default" as const,
      highlighted: true,
      badge: "Most Popular",
      href: "/auth",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For teams with advanced needs",
      features: [
        "Everything in Pro",
        "Custom domain support",
        "SSO integration",
        "Dedicated support & SLA",
        "Team collaboration",
        "White-label solution",
      ],
      cta: "Contact Sales",
      ctaVariant: "outline" as const,
      highlighted: false,
      href: "mailto:sales@flowify.com",
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include beautiful chat interfaces for your n8n workflows.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.highlighted
                  ? "border-primary border-2 shadow-glow"
                  : "border-border"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-6">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted-foreground ml-2">
                      {plan.period}
                    </span>
                  )}
                  {plan.price === "Custom" && (
                    <span className="text-muted-foreground ml-2 block text-sm mt-1">
                      {plan.period}
                    </span>
                  )}
                </div>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations?.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-sm ml-7">{limitation}</span>
                    </li>
                  ))}
                </ul>
                  {plan.name === 'Free' ? (
                    <Button asChild className="w-full">
                      <Link to="/auth">Get Started</Link>
                    </Button>
                  ) : plan.name === 'Pro' ? (
                    <Button 
                      className="w-full" 
                      onClick={handleUpgradeToPro}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? "Processing..." : "Upgrade to Pro"}
                    </Button>
                  ) : (
                    <Button variant="outline" asChild className="w-full">
                      <a href="mailto:sales@flowify.com">Contact Sales</a>
                    </Button>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                What's included in all plans?
              </h3>
              <p className="text-muted-foreground">
                All plans include custom branding (colors, logos, welcome messages), public share links, conversation history, and basic analytics. The main differences are chat instance limits and white-label options.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade to Pro at any time. If you downgrade from Pro to Free, you'll keep your existing chat instances but won't be able to create new ones beyond the limit.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground">
                We accept all major credit cards through Stripe. Enterprise plans can be invoiced annually.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Is there a free trial for Pro?
              </h3>
              <p className="text-muted-foreground">
                The Free plan is perfect for trying out Flowify. When you're ready for unlimited chat instances and white-label features, you can upgrade to Pro anytime.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Do you charge per message?
              </h3>
              <p className="text-muted-foreground">
                No! We believe in simple, transparent pricing. All plans include unlimited messages. You only pay based on the number of chat instances you need and premium features like white-labeling.
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
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary-glow">
              <Link to="/auth">Start Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="mailto:sales@flowify.com">Contact Sales</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
