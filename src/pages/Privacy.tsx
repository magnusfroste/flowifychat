import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Github, Shield, Database, Eye, Server } from "lucide-react";
import flowifyLogo from "@/assets/logo-concept-1-flowing-bubble.png";

const Privacy = () => {
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
            <Shield className="h-4 w-4" />
            Privacy
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </div>

        {/* Privacy Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Approach to Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Flowify is designed with privacy in mind. As an open-source project, we believe in transparency 
              and minimal data collection. We only collect what's necessary for the service to function.
            </p>
          </section>

          {/* What We Collect - Highlighted */}
          <section className="bg-primary/10 border border-primary/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Database className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold mb-4">What We Collect</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When using the hosted Flowify service, we store:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Account data:</strong> Email address for authentication</li>
                  <li><strong className="text-foreground">Chat configurations:</strong> Your chat instance settings and customizations</li>
                  <li><strong className="text-foreground">Chat messages:</strong> Conversations between users and your n8n agents</li>
                  <li><strong className="text-foreground">Session data:</strong> Anonymous session IDs for conversation continuity</li>
                  <li><strong className="text-foreground">Basic analytics:</strong> Page views and message counts (aggregated)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* What We Don't Collect */}
          <section className="bg-muted/50 border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Eye className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold mb-4">What We Don't Collect</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Personal information beyond your email</li>
                  <li>Tracking cookies or advertising data</li>
                  <li>Browsing history outside of Flowify</li>
                  <li>Payment information (the service is free)</li>
                  <li>Location data or device fingerprints</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Third Parties */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The hosted Flowify service uses:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Lovable Cloud:</strong> For hosting and database services</li>
              <li><strong className="text-foreground">Your n8n instance:</strong> Chat messages are sent to your configured webhook URLs</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not sell, share, or transfer your data to any other third parties.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is retained as long as your account is active. Chat messages are stored to enable 
              conversation history. You can delete your chat instances at any time, which will remove 
              associated messages and analytics data.
            </p>
          </section>

          {/* Self-Hosting Recommendation */}
          <section className="bg-accent/10 border border-accent/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Server className="h-6 w-6 text-accent-foreground flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold mb-4">Want Full Control? Self-Host</h2>
                <p className="text-foreground leading-relaxed mb-4">
                  <strong>For maximum privacy and data control, we recommend self-hosting Flowify.</strong>
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  With self-hosting, you get:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
                  <li>Complete ownership of all data</li>
                  <li>Your own database under your control</li>
                  <li>No data shared with any third party</li>
                  <li>Ability to comply with your organization's privacy requirements</li>
                  <li>Custom data retention policies</li>
                </ul>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button className="gap-2">
                    <Github className="h-4 w-4" />
                    Self-Host from GitHub
                  </Button>
                </a>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Access your data through the Flowify dashboard</li>
              <li>Delete your chat instances and associated data</li>
              <li>Export your chat configurations</li>
              <li>Delete your account entirely</li>
            </ul>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              This policy may be updated occasionally. As an open-source project, any changes will be 
              visible in the public repository. Continued use of Flowify after changes constitutes 
              acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Questions?</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related questions, please open an issue on our GitHub repository.
            </p>
            <div className="mt-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Github className="h-4 w-4" />
                Contact via GitHub
              </a>
            </div>
          </section>

        </div>

        {/* Related Links */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/terms">
            <Button variant="outline">Read Terms of Service</Button>
          </Link>
          <Link to="/auth">
            <Button>Get Started Free</Button>
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

export default Privacy;
