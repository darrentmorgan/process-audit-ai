# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Development server (usually runs on port 3000, may use 3001 if 3000 is busy)
npm run dev

# Build for production
npm run build

# Production server
npm start

# Linting
npm run lint

# Supabase setup (automated)
npm run setup:supabase     # Full guided setup
npm run setup:quick        # Quick setup with defaults
npm run validate           # Validate current setup
```

## Application Architecture

### Core Application Flow
ProcessAudit AI is a 4-step workflow application that guides users through business process analysis:

1. **Process Input** (`ProcessInput.jsx`) - File upload or manual description
2. **Discovery Questions** (`QuestionForm.jsx`) - AI-generated targeted questions  
3. **AI Analysis** (`AnalysisLoader.jsx`) - Processing with progress indicators
4. **Audit Report** (`AuditReport.jsx`) - Comprehensive results with multiple tabs

### Access Control System
The application uses a dual-mode access pattern controlled by `pages/index.js`:

- **Landing Page Mode** (default): Shows `LandingPage.jsx` with authentication CTAs and waitlist
- **Application Mode**: Shows `ProcessAuditApp.jsx` when user is authenticated OR has `?access=granted` parameter

Development access routes:
- `?access=granted` - Direct app access
- `/dev-access` - Automatic redirect to `?access=granted`

### AI Integration Architecture
The AI system is designed to gracefully fallback when external APIs are unavailable:

- **Primary**: Claude API integration via `utils/aiPrompts.js` (when `CLAUDE_API_KEY` provided)
- **Fallback**: Comprehensive sample data ensures full functionality demonstration
- **Token Management**: Claude Sonnet (8192 tokens) with built-in token limit awareness

### Data Flow
1. `ProcessInput` → `/api/generate-questions` → `QuestionForm`
2. `QuestionForm` → `/api/analyze-process` → `AuditReport`
3. File processing handled by `/api/process-file` and `utils/fileProcessor.js`

### Authentication System
Supabase-based authentication with graceful degradation:
- `contexts/AuthContext.js` provides authentication state
- `hooks/useSupabase.js` handles database operations
- App functions fully without authentication (shows landing page)
- Database operations only work when Supabase is configured

## Key Configuration

### Environment Variables
- `CLAUDE_API_KEY` - Optional, enables real AI analysis (uses sample data otherwise)
- `NEXT_PUBLIC_SUPABASE_URL` - Optional, enables authentication and data persistence
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Optional, for Supabase authentication
- `NEXT_PUBLIC_APP_URL` - For deployment, affects password reset URLs

### Database Schema
- Main schema: `database/schema.sql` (audit reports, saved reports, user profiles)
- Waitlist schema: `database/waitlist-schema.sql` (landing page email collection)
- Migration files: `supabase/migrations/`

### AI Prompt Structure
`utils/aiPrompts.js` contains three main prompts:
- `QUESTION_GENERATION_PROMPT` - Generates 6-8 discovery questions with follow-up triggers
- `PROCESS_ANALYSIS_PROMPT` - Comprehensive analysis with ROI calculations and implementation roadmaps
- `DYNAMIC_FOLLOWUP_PROMPT` - Context-aware follow-up question generation

The AI responses follow specific JSON structures that map to component expectations:
- Questions: Array with `id`, `question`, `type`, `options`, `followUpTriggers`
- Analysis: Object with `executiveSummary`, `automationOpportunities`, `roadmap`, `implementationGuidance`

## Component Architecture

### Main Application Components
- `ProcessAuditApp.jsx` - Main app container with step management
- `StepIndicator.jsx` - Progress visualization component
- `UserMenu.jsx` - Authentication status and user actions

### Form Components
- `ProcessInput.jsx` - File drag-drop and text input with validation
- `QuestionForm.jsx` - Dynamic form generation from AI-generated questions
- `AnalysisLoader.jsx` - Progress indicator with simulated analysis steps

### Report Components  
- `AuditReport.jsx` - Multi-tab report display (Overview, Opportunities, Implementation, Guidance)
- `SavedReportsModal.jsx` - Report management and retrieval

### Authentication Components
- `AuthModal.jsx` - Sign in/sign up modal with form validation
- `LandingPage.jsx` - Marketing page with authentication CTAs and waitlist

## File Processing

The app supports multiple file formats via `utils/fileProcessor.js`:
- PDF, DOC, DOCX, TXT files
- Text extraction and content preprocessing
- File size validation and error handling

## Deployment

### Vercel Configuration
- `vercel.json` configures API function timeouts (30s for AI processing)
- All API endpoints have extended timeout for AI operations
- Auto-deployment from main branch

### Script Utilities
- `scripts/setup-supabase.sh` - Interactive Supabase setup
- `scripts/quick-supabase.sh` - Automated setup with defaults
- `scripts/validate-setup.sh` - Environment validation
- `scripts/apply-schema.sh` - Database schema application

## Important Implementation Notes

### Error Handling Patterns
- All AI API calls include comprehensive error handling with fallback data
- Authentication operations gracefully handle missing Supabase configuration
- File upload includes validation and user-friendly error messages

### State Management
- Global authentication state via React Context (`AuthContext`)
- Component-level state for multi-step workflow
- No external state management library used

### Styling System
- Tailwind CSS with custom gradient backgrounds
- Component-specific CSS classes in `styles/globals.css`
- Responsive design with mobile-first approach
- Custom color variables: `--primary`, `--secondary`, `--success`, `--warning`

### Token Limit Management
All AI prompts include explicit token limit instructions to ensure responses fit within Claude Sonnet's 8192 token limit. The prompts are optimized to generate concise but comprehensive responses.