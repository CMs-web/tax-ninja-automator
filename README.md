# Tax Ninja - Automated GST Filing SaaS

A modern, automated GST filing platform built with Next.js, Node.js, and Supabase.

## Features

- 🔐 Secure Authentication & Authorization
- 📄 Automated Invoice Processing with OCR
- 💰 GST Calculation & Filing
- 💳 Integrated Payment Processing
- 📱 Real-time Notifications
- 📊 Comprehensive Dashboard
- 🔄 Automated GST Return Filing

## Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- Shadcn UI
- React Query

### Backend
- Node.js with Express.js
- Supabase (PostgreSQL)
- Bull.js for Queue Processing
- JWT Authentication

### External Services
- Google Vision API (OCR)
- GST Suvidha Provider (GSP) API
- Razorpay Payment Gateway
- Twilio (SMS/WhatsApp)
- SendGrid (Email)

## Getting Started

### Prerequisites
- Node.js >= 18
- npm or yarn
- Supabase Account
- Required API Keys (GSP, Razorpay, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tax-ninja.git
cd tax-ninja
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
tax-ninja/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # Reusable UI components
│   ├── lib/             # Utility functions and helpers
│   ├── api/             # API routes
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
└── prisma/             # Database schema and migrations
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@taxninja.com or join our Slack channel.
