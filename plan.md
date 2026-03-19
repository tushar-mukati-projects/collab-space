# CollabSpace — Implementation Plan

## Phase 1: Frontend (with API Mocking)

### 1.1 Project Setup
- [x] Initialize Next.js 14+ with App Router
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Set up project structure (feature-based)
- [x] Set up MSW (Mock Service Worker) for API mocking
- [x] Configure Zustand stores
- [x] Set up mock data + types

### 1.2 Layout & Navigation
- [x] App shell: sidebar + header + main content area
- [x] Workspace switcher (multi-tenant)
- [x] Sidebar navigation: Documents, Boards, Meetings, Settings
- [x] Command palette (Cmd+K)
- [x] User avatar + dropdown menu
- [x] Responsive layout (mobile sidebar drawer)

### 1.3 Authentication (Mocked)
- [x] Mock auth context (user session, roles)
- [x] Auto-login with mock user on mount
- [ ] Login page (deferred — will add with Clerk in Phase 2)
- [ ] Sign up page (deferred — will add with Clerk in Phase 2)

### 1.4 Documents (Notion-like)
- [x] Document list view (sidebar tree with nesting)
- [x] Document editor with editable title, icon, content area
  - Placeholder textarea (Tiptap integration in Phase 2)
  - Slash command placeholder
- [x] Document metadata (title, icon, cover image gradient)
- [x] Real-time collaboration indicators (mock presence avatars)
- [x] Create document dialog with icon selector
- [ ] Tiptap block editor (Phase 2 — currently using textarea)

### 1.5 Tickets / Issues (Linear-like)
- [x] Ticket list view with filters (status, priority, assignee, label)
- [x] Ticket detail view with:
  - Title, description, status, priority, assignee, labels
  - Activity feed / comments
  - Due date picker
- [x] Create ticket modal
- [x] Filter bar with multi-select dropdowns + search
- [ ] Bulk actions (future enhancement)
- [ ] Keyboard shortcuts j/k (future enhancement)

### 1.6 Kanban Board
- [x] Board view with columns (status-based)
- [x] Drag-and-drop cards between columns (dnd-kit)
- [x] Card preview (title, priority badge, assignee avatar, labels)
- [x] Quick-add card inline
- [x] Drag overlay with visual feedback

### 1.7 Video Scheduling & Conferencing
- [x] Meeting scheduler (date/time picker, participant selector)
- [x] Meeting list (upcoming, past) with status badges
- [x] Video room UI (mock):
  - Participant grid view
  - Mute/unmute, camera on/off, screen share
  - Chat sidebar + participant list
  - Duration timer, recording indicator
  - Leave meeting button

### 1.8 Notifications
- [x] Notification bell with unread count
- [x] Notification dropdown/panel with all types
- [x] Mark as read / mark all as read
- [x] Notification preferences in settings

### 1.9 Settings & Workspace
- [x] Workspace settings (name, members list)
- [x] Member management (invite, roles, remove)
- [x] Profile settings (name, avatar, email)
- [x] Theme toggle (light/dark)
- [x] Appearance settings (theme, accent color, font size)

---

## Phase 2: Backend & API

### 2.1 Backend Setup
- [ ] Node.js + tRPC server
- [ ] Prisma schema + PostgreSQL
- [ ] Redis setup
- [ ] Clerk integration
- [ ] Replace MSW mocks with real API calls

### 2.2 Core APIs
- [ ] Auth (Clerk webhooks, user sync)
- [ ] Workspaces CRUD
- [ ] Documents CRUD + Hocuspocus for real-time
- [ ] Tickets CRUD + real-time updates
- [ ] Boards (kanban state persistence)
- [ ] Comments / Activity feed
- [ ] Notifications (in-app + email via BullMQ)

### 2.3 Real-Time
- [ ] Yjs + Hocuspocus for document collaboration
- [ ] WebSocket subscriptions for ticket/board updates
- [ ] Presence indicators (who's online, who's viewing)

### 2.4 Video
- [ ] LiveKit server setup
- [ ] Room creation/management API
- [ ] Token generation for participants
- [ ] Recording support

### 2.5 Email Notifications
- [ ] React Email templates
- [ ] Resend integration
- [ ] BullMQ jobs for: ticket assigned, mentioned, meeting reminder

---

## Phase 3: Mobile App

- [ ] Expo + React Native setup
- [ ] Shared types with web
- [ ] Core screens: Documents, Tickets, Boards, Meetings
- [ ] Push notifications (FCM)
- [ ] Offline support (basic)

---

## Phase 4: Infrastructure & Deployment

- [ ] Dockerfiles (web, api, workers)
- [ ] Docker Compose for local dev
- [ ] Terraform (AWS: EKS, RDS, ElastiCache, S3)
- [ ] Kubernetes manifests
- [ ] GitHub Actions CI/CD
- [ ] Sentry error tracking
- [ ] Health checks + monitoring

---

## File Structure

```
collab-space/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── features/       # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── documents/
│   │   │   │   ├── tickets/
│   │   │   │   ├── boards/
│   │   │   │   ├── meetings/
│   │   │   │   └── notifications/
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # Utilities, config
│   │   │   ├── mocks/          # MSW handlers + mock data
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── types/          # TypeScript types
│   │   └── public/
│   ├── mobile/                 # React Native (Expo)
│   └── api/                    # Node.js backend
├── packages/
│   ├── shared/                 # Shared types, utils
│   └── email/                  # React Email templates
├── infra/                      # Terraform + K8s
├── tech-stack.md
├── plan.md
└── README.md
```
