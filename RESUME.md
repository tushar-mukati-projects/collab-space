# CollabSpace — Real-time Collaborative Project Management Platform

**Role:** Full-Stack Developer | **Type:** Solo Project

## Summary

Built a production-grade SaaS project management platform (Linear/Jira alternative) featuring real-time collaborative editing, video meetings, AI-powered workspace assistant, role-based access control, Stripe billing, and a full DevOps pipeline with Docker and Kubernetes.

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand, TanStack React Query |
| **Backend** | Node.js (Bun runtime), Express 5, TypeScript, Zod validation |
| **Database** | PostgreSQL, Prisma ORM 7 |
| **Real-time** | Hocuspocus (Yjs/CRDT), Socket.io, WebRTC, WebSocket |
| **Auth** | Clerk (SSO, JWT, session management) |
| **Payments** | Stripe (subscriptions, checkout, webhooks, customer portal) |
| **AI** | OpenAI GPT-4o-mini (function calling, SSE streaming) |
| **Storage** | Supabase Storage (file uploads) |
| **Email** | Nodemailer (SMTP, HTML templates) |
| **Rich Text** | BlockNote, TipTap (collaborative editing with CRDT sync) |
| **Charts** | Recharts (interactive data visualization) |
| **Testing** | Jest (69 unit tests), Playwright (E2E), MSW (API mocking) |
| **DevOps** | Docker, Docker Compose, Kubernetes, Nginx Ingress, Let's Encrypt TLS, cert-manager |

## Key Features

### Kanban Board System
- Drag-and-drop ticket management across 5 status columns (Backlog, Todo, In Progress, In Review, Done)
- Hierarchical tickets with unlimited sub-ticket nesting and recursive deletion
- Advanced filtering by status, priority, assignee, labels, and search
- Board-level ticket counts with real-time updates

### Real-time Collaborative Editing
- CRDT-based document sync using Hocuspocus + Yjs — multiple users edit simultaneously with live cursors
- Conflict-free merging with automatic persistence to PostgreSQL
- Block-based rich text editor (BlockNote) with slash commands, @mentions, file embeds, and tables

### Video Meetings (WebRTC)
- Peer-to-peer video conferencing with Socket.io signaling
- Camera/mic toggle, screen sharing, in-meeting chat
- Room-based isolation with participant tracking and media state broadcasting

### AI Workspace Assistant ("Ask CollabSpace")
- OpenAI GPT-4o-mini with 5 custom function-calling tools (ticket search, overdue detection, workload analysis, workspace summary, meeting lookup)
- Server-Sent Events (SSE) streaming for real-time token delivery
- Multi-round tool execution (up to 3 rounds) before generating response
- Markdown responses with clickable ticket/meeting links

### Role-Based Access Control (RBAC)
- 13 granular permissions across tickets, boards, labels, members, billing, and settings
- Admin and Member roles with workspace-level customization
- Permission middleware on all API routes
- Admin UI for managing role permissions

### Stripe Billing & Subscriptions
- Three-tier plans (Free, Pro, Enterprise) with Stripe Checkout
- Subscription lifecycle management (active, past_due, canceled, trialing)
- Stripe Customer Portal for self-service billing
- Webhook handling for real-time subscription events

### Analytics Dashboard
- Interactive charts: ticket distribution (donut), creation trends (area), workload by assignee (bar)
- Real-time stats: total tickets, completion rate, overdue count
- Activity feed, upcoming deadlines, team overview with per-member progress bars
- Meetings this week with participant avatars

### File Attachments
- Supabase Storage integration for persistent uploads
- Ticket attachments with upload/download/delete
- Rich editor inline image uploads with Supabase persistence
- File type detection, size display, image thumbnails

### Email Notifications
- Transactional emails on ticket assignment with styled HTML templates
- Workspace invitation emails
- Configurable notification preferences (email, push, per-event toggles)

### Additional Features
- Command palette (Cmd+K) with fuzzy search across tickets, boards, meetings
- Favorites system for pinning tickets
- Appearance settings (light/dark/system theme, accent color, font size)
- Full MSW mock server (28 handlers) for zero-backend demo deployment
- NProgress route transitions for fluid navigation feel

## Architecture & Patterns

- **Service-oriented backend** — Controllers, Services, Middleware, Schemas (Zod), Routes
- **Modular frontend** — Feature folders with colocated hooks (60+ custom hooks, each in its own file)
- **Full type safety** — TypeScript end-to-end, shared types, Zod request validation
- **Real-time architecture** — Three WebSocket layers: Hocuspocus (collab), Socket.io (meetings), SSE (AI streaming)
- **Testing pyramid** — 69 Jest unit tests (services, middleware, schemas, permissions), Playwright E2E, MSW mock layer

## DevOps & Infrastructure

- **Docker** — Multi-stage Dockerfiles for server (Bun) and web (Next.js), Docker Compose with Stripe CLI webhook forwarding
- **Kubernetes** — Namespace isolation, Deployments with resource limits, LoadBalancer Services, health probes
- **Nginx Ingress** — TLS termination with Let's Encrypt/cert-manager, WebSocket upgrade headers, domain routing (collabspace.io + api.collabspace.io)
- **CI/CD ready** — Containerized builds, environment-based config, K8s secrets management
