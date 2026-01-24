import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Github, AlertTriangle, Server, Scale } from "lucide-react";
import flowifyLogo from "@/assets/logo-concept-1-flowing-bubble.png";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <img src={flowifyLogo} alt="Flowify" className="h-8 w-8" />
              <span className="text-lg font-bold">Flowify</span>
            </Link>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm mb-4">
            <Scale className="h-4 w-4" />
            Legal
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </div>

        {/* Terms Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Flowify. Flowify is a free, open-source service that provides beautiful chat interfaces 
              for your n8n AI agents. By using Flowify, you agree to these Terms of Service. 
              Flowify is provided as a "best effort" community project and is not a commercial service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              Flowify enables users to create and share chat interfaces that connect to n8n webhook endpoints. 
              The service includes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>Chat interface creation and customization</li>
              <li>Shareable links for public access</li>
              <li>Basic analytics and session management</li>
              <li>Cloud hosting on Lovable's infrastructure</li>
            </ul>
          </section>

          {/* Disclaimer - Highlighted */}
          <section className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-destructive">3. Disclaimer of Warranties</h2>
                <p className="text-foreground leading-relaxed mb-4">
                  <strong>FLOWIFY IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, 
                  EXPRESS OR IMPLIED.</strong>
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The maintainers of Flowify make no guarantees regarding:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Service availability or uptime</li>
                  <li>Data persistence or backup</li>
                  <li>Security of transmitted data</li>
                  <li>Compatibility with your n8n workflows</li>
                  <li>Response times or performance</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE FLOWIFY MAINTAINERS 
              SHALL NOT BE LIABLE FOR ANY:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Direct, indirect, incidental, or consequential damages</li>
              <li>Loss of data, revenue, or business opportunities</li>
              <li>Service interruptions or downtime</li>
              <li>Security breaches or unauthorized access</li>
              <li>Damages arising from your use or inability to use the service</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You use Flowify entirely at your own risk. This is a community project maintained on a best-effort basis.
            </p>
          </section>

          {/* Usage Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By using Flowify, you agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Use the service for lawful purposes only</li>
              <li>Not attempt to abuse, overload, or exploit the service</li>
              <li>Not use the service to transmit harmful or illegal content</li>
              <li>Accept that there are no SLAs, support guarantees, or refunds</li>
              <li>Understand that the service may be discontinued at any time</li>
            </ul>
          </section>

          {/* Production Recommendation - Highlighted */}
          <section className="bg-primary/10 border border-primary/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Server className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold mb-4">6. Production Recommendation</h2>
                <p className="text-foreground leading-relaxed mb-4">
                  <strong>For production use cases, we strongly recommend self-hosting Flowify.</strong>
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Self-hosting gives you:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
                  <li>Full control over your infrastructure and data</li>
                  <li>Custom domain with proper DNS configuration</li>
                  <li>Your own database and backup strategy</li>
                  <li>Ability to scale according to your needs</li>
                  <li>Independence from this hosted service</li>
                </ul>
                <a 
                  href="https://github.com/magnusfroste/flowifychat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button className="gap-2">
                    <Github className="h-4 w-4" />
                    View Self-Hosting Guide on GitHub
                  </Button>
                </a>
              </div>
            </div>
          </section>

          {/* Open Source */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Open Source License</h2>
            <p className="text-muted-foreground leading-relaxed">
              Flowify is open-source software. The source code is available on GitHub and is provided 
              under an open-source license. You are free to fork, modify, and self-host your own instance 
              of Flowify. Contributions to the project are welcome.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms may be updated at any time without prior notice. Continued use of Flowify 
              after changes constitutes acceptance of the new terms. We recommend checking this page 
              periodically for updates.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact & Support</h2>
            <p className="text-muted-foreground leading-relaxed">
              Flowify is a community project. For questions, bug reports, or feature requests, 
              please use GitHub Issues. There is no guaranteed response time or formal support channel.
            </p>
            <div className="mt-4">
              <a 
                href="https://github.com/magnusfroste/flowifychat/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Github className="h-4 w-4" />
                Open an Issue on GitHub
              </a>
            </div>
          </section>

        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to create beautiful chat interfaces for your n8n agents?
          </p>
          <Link to="/auth">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-sm text-muted-foreground text-center">
            © 2025 Flowify. Open Source. Let it Flowify.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
