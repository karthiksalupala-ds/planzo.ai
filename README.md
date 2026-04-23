# ✈️ Planzo.ai – AI-Powered Intelligent Travel Planner

<div align="center">

![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/planzo.ai?style=for-the-badge&label=Last%20Updated)
![GitHub top language](https://img.shields.io/github/languages/top/yourusername/planzo.ai?style=for-the-badge&label=Language)
![GitHub all releases](https://img.shields.io/github/downloads/yourusername/planzo.ai/total?style=for-the-badge&label=Downloads)

![Planzo.ai Banner](https://img.shields.io/badge/Planzo.ai-Smart_Travel_Planning-2563eb?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-2.0.0-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

### 🌍 The Future of Travel Planning is Here

**Planzo.ai** transforms travel planning with AI-powered itineraries, real-time budget tracking, smart logistics analysis, and group expense management. Plan your dream trip in seconds, not days.

[Live Demo](#-quick-start) • [Features](#-comprehensive-features) • [Installation](#-installation) • [Documentation](#-documentation)

</div>

---

## 🎬 Demo in Action

> Add your GIF/MP4 assets to a folder like `docs/demo/` and update these links.

| Feature | Preview |
|--------|---------|
| AI itinerary generation | ![AI Itinerary Demo](docs/demo/ai-itinerary.gif) |
| Budget intelligence dashboard | ![Budget Intelligence Demo](docs/demo/budget-intelligence.gif) |
| Group expense splitting | ![Expense Splitter Demo](docs/demo/expense-splitter.gif) |
| Trip collaboration and voting | ![Collaboration Demo](docs/demo/collaboration.gif) |

**Video walkthroughs (optional):**
- [Full Product Tour (3-5 min)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)
- [How AI planning works](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

---

## ⚡ Getting Started in 5 Minutes

### 1) Clone + Install (2 minutes)

```bash
git clone https://github.com/yourusername/planzo.ai.git
cd planzo.ai
npm install
```

### 2) Add Environment Variables (2 minutes)

Create `.env` with minimum required keys:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_key
```

### 3) Run App + Create First Trip (1 minute)

```bash
npm run dev
```

Open `http://localhost:5173` and create a trip with destination, budget, and duration.

---

## 🏷️ Topics (for GitHub Discoverability)

Use these GitHub topics on your repository:

`travel`, `ai`, `react`, `typescript`, `travel-planner`, `itinerary-generator`, `budget-tracker`, `supabase`, `vite`, `pwa`, `openrouter`, `group-expense-splitter`

---

## 🧩 GitHub Profile Setup

Replace `yourusername/planzo.ai` everywhere in badge URLs with your real GitHub repository path.

Recommended badges already included at the top:
- Total downloads
- Top language
- Last updated (last commit)

Tip: If you do not publish releases yet, switch download badge to this fallback:

```md
![Repo views](https://komarev.com/ghpvc/?username=yourusername&repo=planzo.ai&style=for-the-badge)
```

---

## 🎯 About Planzo.ai

Are you tired of spending hours researching flights, hotels, and activities? **Planzo.ai** is your intelligent travel companion that understands your budget, preferences, and travel style. Using advanced AI algorithms, it generates comprehensive day-by-day itineraries tailored specifically for you.

### Why Planzo.ai?

| Aspect | Traditional Planning | Planzo.ai |
|--------|---------------------|-----------|
| **Time to Plan** | 4-8 hours | 30 seconds |
| **Budget Tracking** | Manual spreadsheets | AI-powered real-time analysis |
| **Personalization** | Generic suggestions | AI learns your preferences |
| **Logistics** | Multiple websites | Unified smart comparison |
| **Group Planning** | Scattered emails | Collaborative voting & expenses |
| **Price Tracking** | Manual checks | Automated alerts |

---

## ✨ Comprehensive Features

### 🤖 **AI-Powered Itinerary Generation**
- Generate complete day-wise travel plans in real-time
- Stream-based response for instant feedback  
- Customizable based on mood, budget, and duration
- Self-healing: auto-regenerate days that need adjustments

### 💰 **Smart Budget Intelligence**
- **Real-time Budget Analyzer**: Breakdown by accommodation, food, activities, transport
- **Health Alerts**: Yellow flag at 85% budget, red flag if overspending
- **Recommendations**: AI suggests where to cut/splurge costs
- **Per-Person Tracking**: See individual costs for group trips
- **Visual Charts**: Category breakdowns with Recharts visualizations

### 🚚 **Advanced Logistics Analysis**
- **Smart Scoring System**: 
  - ⚡ Value Score (best bang-for-buck)
  - 💚 Comfort Score (amenities + rating)
  - 🔥 Speed Score (duration ranking)
  - 🌱 Eco Score (carbon footprint)
- **Real Transport Prices**: Actual flight, train, bus costs
- **Intelligent Recommendations**: Best value, fastest, most comfortable, most eco-friendly
- **Stable Deep Links**: Avoid 404s with provider homepages

### 👥 **Group Expense Splitter**
- Automatic settlement calculations (who owes whom)
- Member balance tracking with visual indicators
- Quick expense adding with auto-splitting
- AI-powered payment suggestions (UPI, credit card, etc.)
- Minimal payment algorithm for settling debts

### 📉 **Price Watch & Alerts**
- 30-day price trend tracking with visual charts
- Intelligent booking window recommendations
- Auto-alerts when prices drop below threshold
- AI forecasting: "Book now vs wait" advice
- Best booking times by day of week (Tuesday-Thursday)

### 👫 **Trip Collaboration & Voting**
- Invite travelers by email
- Democratic activity voting system
- Mark activities as optional/must-have
- Real-time activity discussions with comments
- AI auto-schedules voted activities based on location & timing

### 📱 **Mobile-First Design**
- Responsive layout for phone, tablet, desktop
- Safe-area padding for notch devices
- Bottom navigation on mobile
- Floating chat assistant (draggable on desktop, tapable on mobile)
- PWA support for offline access

### 🗺️ **Interactive Trip Planning**
- Real-time destination autocomplete
- Weather integration for trip dates
- Safety tips and local transport guides
- Automated packing checklists
- Multi-city trip support
- Long-trip mode (6+ days) with special handling

### 💬 **AI Chat Assistant**
- Ask questions about your trip
- Real-time streaming responses
- Context-aware: understands your itinerary
- Accessible anywhere in the app
- Chat history preservation

### 🔐 **Secure & Collaborative**
- Supabase Auth with email/password
- Secure trip sharing (URL-based with unique IDs)
- Multi-user collaboration with roles
- Row-level security on database
- Trip ownership & privacy controls

---

## 🏗️ Technology Stack

<div align="center">

| Category | Technologies |
|----------|--------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **State** | React Hooks, Context API, React Query |
| **Backend** | Supabase (Auth, PostgREST, Edge Functions) |
| **AI/LLM** | OpenRouter API, Streaming responses |
| **Database** | PostgreSQL with RLS policies |
| **Visualization** | Recharts, Lucide React icons |
| **Utilities** | date-fns, Zod validation, React Router |
| **Build** | Vite, ESBuild, PWA Plugin |
| **Testing** | Vitest, Testing Library |

</div>

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn**: Package manager
- **Git**: Version control
- **Supabase Account**: For backend services ([Sign up](https://app.supabase.com))
- **OpenRouter API Key**: For AI features ([Get key](https://openrouter.ai))

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/planzo.ai.git
cd planzo.ai
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_SERVICE_KEY=your_service_key

# OpenRouter API (for AI features)
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Optional: Weather API
VITE_WEATHER_API_KEY=your_weather_api_key
VITE_OPENWEATHER_API_KEY=your_openweather_key

# Optional: Pexels Images
VITE_PEXELS_API_KEY=your_pexels_key
```

### Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or next available port)

---

## 📖 Usage Guide

### Creating Your First Trip

1. **Visit the Home Page** → Click "Plan Trip"
2. **Enter Trip Details**:
   - 🌍 Destination(s)
   - 💰 Budget (₹)
   - 📅 Duration (days)
   - 👥 Number of travelers
   - 📍 Travel date
   - 🎭 Travel mood (Adventure, Relaxation, etc.)
3. **Click "Create My Adventure"** → Wait for AI to generate plan (15-30 seconds)
4. **Review & Customize**:
   - View day-by-day itinerary
   - Check budget breakdown
   - Browse transport options
   - Look at logistics analysis

### Using Smart Features

#### Budget Analysis
```
Logistics Tab → Budget Intelligence → View:
- Category breakdown (accommodation, food, activities, etc.)
- AI recommendations for savings
- Per-person daily costs
- Budget health status (green/yellow/red)
```

#### Smart Logistics
```
Logistics Tab → Smart Logistics Analysis → See:
- Transport options ranked by: value, comfort, speed, eco-score
- Real prices from providers
- Amenities & ratings
- Book via direct links to providers
```

#### Group Expenses
```
Logistics Tab → Group Expense Splitter → Manage:
- Add travelers
- Track shared expenses
- Calculate settlements (who owes whom)
- Generate payment instructions
```

#### Price Alerts
```
Logistics Tab → Price Watch & Alerts → Set:
- Alert threshold (e.g., ₹8000)
- Get notified on price drops
- View 30-day price trends
- See best booking windows
```

### Collaborating with Friends

1. **Save Trip** → Click Save button
2. **Share Trip** → Get unique trip URL
3. **Invite Collaborators** → Add by email
4. **Suggest Activities** → Vote on options
5. **Track Expenses** → Use splitter for settlements

---

## 🎨 UI/UX Highlights

### Modern Design System
- Clean, minimalist interface with vibrant accent colors
- Dark mode support with smooth transitions
- Glass-morphism effects for depth
- Micro-animations for delightful interactions

### Responsive Breakpoints
```
Mobile (< 768px) → Optimized single-column layout
Tablet (768px-1024px) → Two-column grid
Desktop (> 1024px) → Three-column layout with sidebars
```

### Accessibility Features
- ARIA labels and semantic HTML
- Keyboard navigation support
- High contrast for dark mode
- Screen reader optimized

---

## 🔧 Development

### Project Structure

```
planzo.ai/
├── src/
│   ├── components/          # React components
│   │   ├── BudgetAnalyzer.tsx
│   │   ├── LogisticsIntelligence.tsx
│   │   ├── GroupExpenseSplitter.tsx
│   │   ├── TripCollaboration.tsx
│   │   ├── Chatbot.tsx
│   │   ├── FloatingChatButton.tsx
│   │   └── ...
│   ├── pages/              # Page routes
│   │   ├── PlanTrip.tsx
│   │   ├── Auth.tsx
│   │   ├── Profile.tsx
│   │   └── ...
│   ├── lib/                # Utilities
│   │   ├── stream-ai.ts    # Streaming LLM calls
│   │   ├── pexels.ts       # Image fetching
│   │   ├── calendar.ts     # Calendar integration
│   │   └── ...
│   ├── types/              # TypeScript definitions
│   ├── contexts/           # React Context
│   ├── hooks/              # Custom hooks
│   └── data/               # Static data
├── supabase/               # Database migrations & functions
├── package.json
└── vite.config.ts
```

### Available Scripts

```bash
npm run dev        # Start dev server (hot reload)
npm run build      # Production build
npm run preview    # Preview production build
npm run test       # Run tests
npm run lint       # Run ESLint
```

---

## 🌐 Deployment

### Deploy on Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy on Netlify

1. Connect GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist/`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Environment Variables for Production

Set these in your hosting platform's dashboard:
- All `.env` variables listed above
- Make sure `VITE_SUPABASE_SERVICE_KEY` is kept secret

---

## 📊 Database Schema

### Core Tables

```
users              → Supabase Auth users
saved_trips        → User's saved itineraries
trip_collaborators → Share trips with others
trip_expenses      → Shared expenses tracking
price_watches      → Price alert tracking
trip_votes         → Activity voting
```

### Key Features
- Row-Level Security (RLS) for data privacy
- Automatic timestamps on all tables
- Cascading deletes for data integrity

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and commit: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Contribution Guidelines
- Follow TypeScript best practices
- Write clean, readable code
- Add comments for complex logic
- Test your changes locally
- Update README if needed

---

## 🐛 Troubleshooting

### Issue: Port Already in Use
```bash
# Use a specific port
npm run dev -- --port 3000
```

### Issue: Supabase Connection Error
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Verify Supabase project is active
- Check network connectivity

### Issue: AI Responses Not Streaming
- Verify `VITE_OPENROUTER_API_KEY` is set
- Check OpenRouter account has quota
- Verify API key has permission to use models

### Issue: Images Not Loading
- Check Pexels API key is valid
- Verify internet connection
- Check browser console for CORS errors

---

## 📝 API Documentation

### LLM Streaming API

```typescript
// Generate trip itinerary with streaming
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-4-turbo-preview',
    messages: [{
      role: 'user',
      content: `Generate a ${days}-day trip to ${destination} with ₹${budget} budget`
    }],
    stream: true
  })
});
```

### Supabase Integration

```typescript
// Save trip
const { data, error } = await supabase
  .from('saved_trips')
  .insert({
    user_id: user.id,
    title: tripTitle,
    destination,
    plan_data: tripData,
    budget,
    is_public: false
  });
```

---

## 📱 Screenshots & Features

### Key Screens

**Home Screen**
- Hero section with value proposition
- Destination carousel
- Featured itineraries
- Sign-in prompt

**Trip Planner**
- Budget slider with live updates
- Mood-based customization
- Real-time trip generation

**Logistics Dashboard**
- Transport options analysis
- Budget breakdown charts
- Price tracker
- Expense calculator

**Collaboration Panel**
- Activity voting
- Team management
- Expense splitting

---

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💼 About the Author

**Salupala Karthik**  
Data Science & Full-Stack Developer  
*B.Tech – Data Science*

- 🔗 [GitHub](https://github.com/yourusername)
- 💼 [LinkedIn](https://linkedin.com/in/yourusername)
- 📧 [Email](mailto:karthik@example.com)

---

## 🙏 Acknowledgments

- **OpenAI** for GPT family models
- **Supabase** for backend infrastructure
- **React & Vite** communities
- **Tailwind CSS** for styling framework
- **shadcn/ui** for component library

---

## 📞 Support & Contact

- 🐛 **Report Bugs**: [GitHub Issues](https://github.com/yourusername/planzo.ai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/planzo.ai/discussions)
- 📧 **Email Support**: support@planzo.ai

---

<div align="center">

**Made with ❤️ for travelers worldwide**

[⬆ Back to Top](#-planzoai--ai-powered-intelligent-travel-planner)

</div>
