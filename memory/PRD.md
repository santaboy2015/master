# LOVE-AI - Product Requirements Document

## Overview
A SaaS dating assistant platform powered by GPT-5.2 AI that helps users improve their online dating experience through conversation starters, chat reply suggestions, bio generation, and profile optimization.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Framer Motion
- **Backend**: FastAPI (Python 3.11)
- **Database**: MongoDB
- **Authentication**: Emergent Google OAuth
- **AI**: GPT-5.2 (text) + GPT-4o (vision) via Emergent LLM Key
- **Payments**: Stripe
- **PWA**: Service Worker + Web App Manifest

## User Personas
1. **Singles (18-45)**: Using dating apps (Tinder, Bumble, Hinge) who want help with conversations
2. **Admin**: Platform owner managing site content, pricing, and users

## Core Requirements (Static)
- Google OAuth authentication
- AI-powered conversation starters
- Chat reply suggestions
- Bio generation with optional photo analysis
- Profile review with optional photo analysis
- Subscription tiers (Free/Pro/Premium)
- Stripe payment integration
- Admin dashboard with full control
- PWA with offline capabilities
- Production-grade security headers

## What's Been Implemented

### Feb 21, 2026 - PWA & Production Hardening
- [x] PWA manifest linked and configured
- [x] Service worker with caching strategies
- [x] PWA icons (192x192, 512x512)
- [x] Apple touch icon support
- [x] Deep linking fix (intended path preserved through OAuth flow)
- [x] Security headers middleware (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
- [x] Request ID tracking (X-Request-ID header)
- [x] Structured JSON logging
- [x] Enhanced health check endpoint with DB status
- [x] Global exception handler

### Feb 21, 2025 - Initial Build
- [x] Landing page with dynamic content
- [x] Google OAuth login
- [x] Dashboard with usage stats
- [x] Conversation Starters (GPT-5.2)
- [x] Chat Reply Suggestions (GPT-5.2)
- [x] Bio Generator with image upload (GPT-4o vision)
- [x] Profile Review with image upload (GPT-4o vision)
- [x] Pricing page with 3 tiers
- [x] Stripe checkout integration
- [x] Theme toggle (dark/light)
- [x] Admin authentication (email whitelist + password)
- [x] Admin dashboard with analytics
- [x] Site settings management
- [x] Pricing plans management
- [x] AI prompts customization
- [x] API keys management
- [x] User management (view, edit, delete)
- [x] Legal pages (Privacy, Terms, Refund, Cookie, AI Disclosure, Disclaimer, Contact)

## Subscription Tiers
| Plan | Price | Credits/Month | Features |
|------|-------|---------------|----------|
| Free | $0 | 5 | Basic features |
| Pro | $9.99 | 100 | All features + priority support |
| Premium | $19.99 | 500 | All features + 24/7 support |

## Admin Access
- Email: sevillajames2001@gmail.com
- Default Password: RizzAdmin2024!
- Access: /admin/login (after Google OAuth)

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core AI features
- [x] Authentication
- [x] Admin dashboard
- [x] Payment integration

### P1 (High)
- [ ] Email notifications for subscription changes
- [ ] Usage analytics tracking per feature
- [ ] Password reset for admin

### P2 (Medium)
- [ ] Multi-language support
- [ ] A/B testing for landing page
- [ ] Referral program
- [ ] Chat history saving

## API Endpoints
- `GET /api/settings/site` - Public site settings
- `GET /api/settings/pricing` - Public pricing
- `POST /api/auth/session` - Exchange OAuth session
- `GET /api/auth/me` - Current user
- `POST /api/ai/*` - AI generation endpoints
- `POST /api/upload/image` - Image upload
- `GET/PUT /api/admin/settings/*` - Admin settings
- `GET/PUT/DELETE /api/admin/users/*` - User management
- `GET /api/admin/analytics` - Platform analytics

## Next Tasks
1. Add email notifications for subscription upgrades
2. Implement usage analytics dashboard
3. Add password reset functionality
4. Consider adding chat history feature
