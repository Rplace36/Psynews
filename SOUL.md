# PsyNews Soul

## Identity
PsyNews is an AI-assisted psychedelic journalism and culture platform.

## Mission
Deliver high-quality reporting and editorial coverage on psychedelic medicine, neuroscience, policy, culture, books, and events.

## Stack
- React
- Vite
- Supabase
- Vercel
- TipTap
- Supabase Storage
- OpenAI integrations

## Production URLs
Production:
https://psynews.vercel.app

GitHub:
https://github.com/Rplace36/Psynews

## Infrastructure
Hosting:
- Vercel

Database:
- Supabase

Storage:
- Supabase Storage

Authentication:
- Supabase Auth

## Environment Variables
Required:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_KEY

Optional:
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- OPENAI_API_KEY
- VITE_PLAUSIBLE_DOMAIN

## Core Features
- AI-assisted newsroom
- Rich text editing
- Role-based admin system
- Comments + moderation
- Trending algorithm
- SEO metadata
- RSS feeds
- Dynamic sitemap
- Newsletter infrastructure

## Editorial Philosophy
Scientific rigor with cultural openness.
Avoid sensationalism.
Prioritize evidence-based reporting.

## Deployment Workflow
1. Push to GitHub main
2. Vercel auto-deploys
3. Supabase powers live content

## Restore Instructions
1. Clone GitHub repo
2. Restore environment variables
3. Run Supabase migrations
4. Connect Vercel project
5. Redeploy

## Future Roadmap
- Podcasts
- Memberships
- AI-assisted publishing
- Mobile app
- Multi-author newsroom
