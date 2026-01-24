# Flowify 🌊

**Beautiful chat interfaces for your n8n AI agents.**

Flowify transforms your n8n webhook endpoints into stunning, production-ready chat experiences. Inspired by ChatGPT, Claude, and Grok – no coding required.

[![Open Source](https://img.shields.io/badge/Open%20Source-MIT-green.svg)](LICENSE)
[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4.svg)](https://lovable.dev)

---

## ✨ Features

- **Modern Chat UI** – ChatGPT-quality interfaces with streaming responses, markdown support, and syntax highlighting
- **Brand Presets** – One-click themes inspired by Grok, Claude, and ChatGPT
- **Full Customization** – Colors, fonts, avatars, welcome messages, and quick-start prompts
- **Shareable Links** – Get a beautiful URL for each chat instance
- **Multi-Tenant** – Manage unlimited chat interfaces from one dashboard
- **Real-Time** – Streaming responses, typing indicators, and conversation history
- **Session Management** – Persistent conversations with session tracking
- **Analytics** – Basic usage metrics and conversation insights

---

## 🚀 Quick Start

### Option 1: Use Flowify Cloud (Free)

The fastest way to get started:

1. Go to [flowifychat.lovable.app](https://flowifychat.lovable.app)
2. Sign up with your email
3. Paste your n8n webhook URL
4. Customize the look and feel
5. Share your chat link!

**Note:** Cloud hosting is free but provided on a "best effort" basis. For production use cases, we recommend self-hosting.

### Option 2: Self-Host (Recommended for Production)

Self-hosting gives you full control over your data, custom domains, and infrastructure.

---

## 🛠️ Self-Hosting Guide

### Prerequisites

- Node.js 18+ or Bun
- A Supabase account (free tier works great)
- A hosting platform (Vercel, Netlify, Cloudflare Pages, etc.)

### Step 1: Clone the Repository

```bash
git clone https://github.com/magnusfroste/flowifychat.git
cd flowifychat
```

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# Using bun (faster)
bun install
```

### Step 3: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your:
   - Project URL
   - Anon/Public key

3. Run the database migrations. In the Supabase SQL Editor, execute the migrations found in `/supabase/migrations/` in order.

4. Enable Row Level Security (RLS) on all tables – the migrations should handle this automatically.

### Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Step 5: Run Locally

```bash
# Development mode
npm run dev

# Build for production
npm run build
```

### Step 6: Deploy

#### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard.

#### Netlify

```bash
npm run build
# Deploy the 'dist' folder to Netlify
```

#### Docker (Coming Soon)

We're working on an official Docker image. Contributions welcome!

---

## 📁 Project Structure

```
flowifychat/
├── src/
│   ├── components/      # React components
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and helpers
│   ├── theme/           # Theme provider and styles
│   └── integrations/    # Supabase client
├── supabase/
│   ├── functions/       # Edge functions
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

---

## 🎨 Customization

### Brand Presets

Flowify includes ready-to-use presets:

| Preset | Style |
|--------|-------|
| **Grok** | Dark mode, turquoise accents, X/Twitter aesthetic |
| **Claude** | Warm paper tones, terracotta accents, elegant typography |
| **ChatGPT** | Clean white, pill-shaped bubbles, OpenAI style |
| **Minimal** | Light and understated |
| **Professional** | Business-ready dark theme |

### Custom Branding

Every chat instance supports:

- Primary/accent colors
- Background colors and gradients
- Custom fonts
- Avatar images
- Welcome messages
- Quick-start prompt buttons
- Bubble shapes and styles

---

## 🔌 n8n Integration

Flowify works with any n8n workflow that exposes a webhook:

1. In n8n, create a workflow with a **Webhook** trigger
2. Configure your AI logic (OpenAI, Anthropic, local LLM, etc.)
3. Return a response in this format:

```json
{
  "output": "Your AI response here"
}
```

4. Copy the webhook URL and paste it into Flowify

### Supported Response Formats

Flowify automatically handles:
- Plain text responses
- Markdown formatting
- Code blocks with syntax highlighting
- Streaming responses (when n8n supports it)

---

## 🔐 Security

- **Row Level Security (RLS)** – All database tables are protected
- **Input Validation** – Messages are sanitized before processing
- **Rate Limiting** – Built-in protection against abuse
- **Session Isolation** – Each user session is isolated

For production deployments, we recommend:
- Using HTTPS (automatic with most hosting providers)
- Setting up proper authentication for sensitive workflows
- Reviewing and customizing RLS policies for your use case

---

## 🤝 Contributing

Contributions are welcome! Here's how to help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/flowifychat.git

# Install dependencies
bun install

# Start development server
bun run dev
```

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- Powered by [Supabase](https://supabase.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

## 📬 Support

- **Issues:** [GitHub Issues](https://github.com/magnusfroste/flowifychat/issues)
- **Discussions:** [GitHub Discussions](https://github.com/magnusfroste/flowifychat/discussions)

---

**Let it Flowify** 🌊
