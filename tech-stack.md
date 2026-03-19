# CollabSpace — Tech Stack

## Architecture Overview

```
┌─────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Next.js     │  │ React Native │  │  Email Client    │
│  (Web App)   │  │ (Mobile App) │  │  (Notifications) │
└──────┬───────┘  └──────┬───────┘  └────────▲─────────┘
       │                 │                    │
       └────────┬────────┘                    │
                ▼                             │
       ┌────────────────┐            ┌────────┴────────┐
       │   Node.js API  │◄──────────►│    BullMQ        │
       │  (tRPC / REST) │            │  (Job Queue)     │
       └───┬───┬───┬────┘            └─────────────────┘
           │   │   │
     ┌─────┘   │   └──────┐
     ▼         ▼          ▼
┌─────────┐ ┌─────┐ ┌──────────┐
│PostgreSQL│ │Redis│ │  S3/R2   │
│ (Data)   │ │(RT) │ │ (Files)  │
└─────────┘ └─────┘ └──────────┘
                │
          ┌─────┴─────┐
          │  LiveKit   │
          │(Video/SFU) │
          └───────────┘
```

---

## Tech Stack Breakdown

### Frontend — Web
| Layer | Tech | Why |
|-------|------|-----|
| Framework | **Next.js 14+ (App Router)** | SSR, API routes, existing skill |
| State | **Zustand** | Lightweight, no boilerplate vs Redux |
| Real-time sync | **Yjs + y-websocket** | CRDT library — conflict-free collaborative editing |
| Document Editor | **Tiptap v2** (built on ProseMirror) | Block-based editor like Notion, has Yjs plugin built-in |
| Kanban | **dnd-kit** | Best drag-and-drop library for React, accessible |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, consistent, great component primitives |
| Video UI | **LiveKit React SDK** | Pre-built video call components |
| Data Fetching | **tRPC** | End-to-end type safety between Next.js and Node.js |

### Frontend — Mobile
| Layer | Tech | Why |
|-------|------|-----|
| Framework | **React Native (Expo)** | Existing skill, Expo simplifies builds |
| Navigation | **Expo Router** | File-based routing like Next.js |
| Push Notifications | **Firebase Cloud Messaging** | Industry standard |
| Video | **LiveKit React Native SDK** | Same backend, native performance |

### Backend
| Layer | Tech | Why |
|-------|------|-----|
| Runtime | **Node.js** | Existing skill |
| API Layer | **tRPC** | Type-safe API, shared types with frontend |
| WebSocket Server | **Hocuspocus** (Yjs backend) | Handles document collaboration, persistence, auth |
| Auth | **Clerk** | Multi-tenant, org support |
| Email | **React Email + Resend** | Build emails in React components, reliable delivery |
| Job Queue | **BullMQ + Redis** | Background jobs: emails, notifications, reminders |
| File Upload | **UploadThing** or **S3 presigned URLs** | Simple, secure file uploads |

### Database Layer
| Tech | Purpose |
|------|---------|
| **PostgreSQL** | Primary data: users, workspaces, tickets, boards, permissions |
| **Prisma** | ORM — type-safe queries, migrations, great DX |
| **Redis** | Real-time presence, pub/sub, caching, BullMQ backend |
| **S3 / Cloudflare R2** | File storage: attachments, images, recordings |

### Video & Conferencing
| Tech | Why |
|------|-----|
| **LiveKit** (open-source) | Self-hostable WebRTC SFU. Screen sharing, recording, rooms — all built in. Free to self-host |

### Infrastructure
| Layer | Tech |
|-------|------|
| Containerization | **Docker** + **Docker Compose** (dev) |
| Orchestration | **Kubernetes** (prod) |
| IaC | **Terraform** (AWS resources) |
| CI/CD | **GitHub Actions** |
| Cloud | **AWS** (EKS, RDS, ElastiCache, S3) |
| Monitoring | **Sentry** (errors) + **Axiom** (logs) |

---

## Key Libraries

```
# Web
next, react, tiptap, yjs, @hocuspocus/provider, @livekit/components-react
zustand, @trpc/client, @dnd-kit/core, tailwindcss, shadcn/ui

# Mobile
expo, expo-router, react-native, @livekit/react-native
@react-native-firebase/messaging

# Backend
@trpc/server, @hocuspocus/server, livekit-server-sdk
prisma, bullmq, @clerk/nextjs, resend, react-email

# Database
postgresql, redis, @aws-sdk/client-s3
```

---

## What Makes This Stack Resume-Impressive

- **Yjs + Hocuspocus** — Real CRDT-based collaboration, not just "save and refresh"
- **Tiptap** — Production-grade block editor (same tech Notion uses — ProseMirror)
- **LiveKit self-hosted** — Built video infra, not just called an API
- **tRPC** — End-to-end type safety
- **BullMQ** — Proper async job processing
- **Full K8s + Terraform deployment** — Production-ready infrastructure
