<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Tigest Voice AI Landing Page

A modern, high-performance landing page for Voice AI agents with interactive ROI calculator, live voice demo, and seamless integrations.

## 🚀 Features

- **Live Voice Agent Demo** - Interactive voice AI powered by Google Gemini 2.5 Flash
- **ROI Calculator** - Interactive sliders to calculate business impact
- **Responsive Design** - Beautiful dark theme optimized for all devices
- **Tool Calls Support** - Calendar availability, lead capture, and custom integrations
- **Modern Stack** - React 19, TypeScript, Vite, Tailwind CSS

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API Key ([Get one here](https://aistudio.google.com/apikey))

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Kunaal14/voice-ai.git
cd voice-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Required: Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Required: Webhook URLs for form submissions
FORM_WEBHOOK_URL=https://your-webhook-url.com/webhook/landing-page-form

# Required: Webhook URL for voice agent transcripts
TRANSCRIPT_WEBHOOK_URL=https://your-webhook-url.com/webhook/landing-page

# Optional: Calendar availability webhook (for scheduling)
CALENDAR_AVAILABILITY_URL=https://your-webhook-url.com/webhook/calendar-availability
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Webhook Endpoints

The landing page requires webhook endpoints to handle:

1. **Form Submissions** (`FORM_WEBHOOK_URL`)
   - Receives contact form data
   - Expected payload: `{ name, email, website, message, source, timestamp }`

2. **Voice Transcripts** (`TRANSCRIPT_WEBHOOK_URL`)
   - Receives voice conversation transcripts
   - Expected payload: `{ session_id, lead_data, full_transcript, duration_seconds, audio_file }`

3. **Calendar Availability** (`CALENDAR_AVAILABILITY_URL`) - Optional
   - Returns available time slots for scheduling
   - Receives: `{ date?, duration_minutes?, session_id }`
   - Should return: `{ available_slots: string[], message: string }`

### Voice Agent Tool Calls

The voice agent supports the following tool calls:

1. **`capture_lead_info`** - Captures lead details (name, email, business_nature)
2. **`get_calendar_availability`** - Fetches available calendar time slots
3. **`terminate_call`** - Ends the voice session

## 📁 Project Structure

```
├── components/
│   ├── VoiceAgent.tsx       # Main voice agent component
│   ├── ROICalculator.tsx    # Interactive ROI calculator
│   ├── Header.tsx           # Navigation header
│   └── voice/               # Voice agent sub-components
├── services/
│   └── audioUtils.ts       # Audio processing utilities
├── App.tsx                  # Main application component
├── index.tsx                # Application entry point
├── vite.config.ts          # Vite configuration
└── .env.local              # Environment variables (not committed)
```

## 🔒 Security

**Important**: Never commit your `.env.local` file to version control. It's already in `.gitignore`.

All sensitive data (API keys, webhook URLs) should be stored in `.env.local`:
- ✅ `.env.local` - Your actual credentials (gitignored)
- ✅ `.env.example` - Template with placeholder values (committed)

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

The `dist` folder will contain the production-ready files.

### Deploy to Vercel/Netlify

1. Set environment variables in your hosting platform's dashboard
2. Connect your GitHub repository
3. Deploy!

## 🎨 Customization

### Update Branding

- Edit `App.tsx` to change company name, logo, and colors
- Modify `components/Header.tsx` for navigation changes
- Update social links in the footer

### Modify Voice Agent

- Edit `components/VoiceAgent.tsx` to customize AI behavior
- Update `SYSTEM_INSTRUCTION` to change the AI's persona
- Add custom tool calls in the `tools` array

### Styling

- Tailwind CSS classes are used throughout
- Custom styles in `index.html` `<style>` tag
- Color scheme: Dark theme with indigo/purple accents

## 📝 License

This project is open source and available for voice AI builders to use and customize.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share your implementations

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for the Voice AI community**
