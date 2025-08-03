# ProcessAudit AI

An AI-powered web application that helps technical founders identify automation opportunities in their business processes.

## Features

- **Multi-step Process Analysis**: Upload documents or describe processes manually
- **AI-Generated Discovery Questions**: Targeted questions based on your specific process
- **Comprehensive Audit Reports**: Detailed automation opportunities with ROI calculations
- **Implementation Roadmap**: Phased approach with quick wins and strategic initiatives
- **User Authentication**: Secure sign-up/sign-in with Supabase
- **Report Management**: Save, organize, and retrieve audit reports
- **Export Functionality**: Download reports for team review

## Tech Stack

- **Framework**: Next.js 14 with Pages Router
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **AI Integration**: Claude API (with sample data fallback)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Deployment**: Vercel-ready

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Add your API keys to .env.local:
   # - Claude API key (optional, for AI integration)
   # - Supabase URL and key (optional, for authentication)
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Set up Supabase** (optional, for authentication):
   
   **Option A: Automated CLI Setup (Recommended)**
   ```bash
   # Full setup with guided prompts
   ./scripts/setup-supabase.sh
   
   # Or quick setup with defaults
   ./scripts/quick-supabase.sh
   ```
   
   **Option B: Manual Setup**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL commands from `database/schema.sql` in your SQL editor
   - Add your project URL and anon key to `.env.local`

5. **Open application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
process-audit-ai/
├── components/           # React components
│   ├── ProcessAuditApp.jsx    # Main application component
│   ├── StepIndicator.jsx      # Progress indicator
│   ├── ProcessInput.jsx       # File upload and description input
│   ├── QuestionForm.jsx       # Dynamic question form
│   ├── AnalysisLoader.jsx     # Loading state with progress
│   └── AuditReport.jsx        # Comprehensive report display
├── pages/                # Next.js pages
│   ├── _app.js              # App wrapper
│   ├── index.js             # Home page
│   └── api/                 # API endpoints
│       ├── generate-questions.js
│       ├── analyze-process.js
│       └── process-file.js
├── utils/                # Utility functions
│   ├── fileProcessor.js     # File upload handling
│   └── aiPrompts.js         # AI prompts and integration
├── styles/               # CSS files
│   └── globals.css          # Global styles with Tailwind
└── public/               # Static assets
```

## How It Works

1. **Process Input**: Users upload documents (PDF, DOC, TXT) or manually describe their business process
2. **Discovery Questions**: AI generates 5-8 targeted questions based on the process description
3. **Analysis**: AI analyzes responses to identify automation opportunities with priority scoring
4. **Report Generation**: Comprehensive audit report with implementation roadmap and ROI calculations

## API Integration

The application is designed to work with the Claude API for AI analysis. When `CLAUDE_API_KEY` is not provided, the app uses comprehensive sample data to demonstrate functionality.

### Environment Variables

- `CLAUDE_API_KEY`: Optional Claude API key for real AI analysis
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_APP_URL`: Application URL for deployment

## Features in Detail

### Process Input
- Drag-and-drop file upload
- Support for PDF, DOC, DOCX, and TXT files
- Manual process description with rich text input
- File validation and error handling

### Dynamic Questions
- AI-generated questions based on process complexity
- Multiple input types (select, textarea, number)
- Progress tracking and validation
- Question categorization (frequency, resources, tools, pain points)

### Analysis & Reporting
- Automation opportunity identification with priority scoring
- Implementation effort estimation (Low/Medium/High)
- Tool and technology recommendations
- ROI calculations and time savings projections
- Three-phase implementation roadmap
- Risk assessment and success metrics

### Export & Sharing
- JSON report export functionality
- Print-friendly report layouts
- Shareable insights for team collaboration

## Deployment

### Vercel Deployment

1. **Connect to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Configure Environment Variables**:
   Add `CLAUDE_API_KEY` in Vercel dashboard settings

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Manual Deployment

1. **Build application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

## Development

### Adding New Features

1. **Components**: Add new React components in `/components`
2. **API Endpoints**: Create new API routes in `/pages/api`
3. **Utilities**: Add helper functions in `/utils`
4. **Styling**: Extend Tailwind config in `tailwind.config.js`

### Testing

```bash
# Run linting
npm run lint

# Build test
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please create an issue in the GitHub repository.