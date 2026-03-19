// ============================================================================
// Collaborative Workspace App — Type Definitions
// ============================================================================

// --- Enums & Literal Types ---------------------------------------------------

export type UserStatus = "online" | "offline" | "away";

export type UserRole = "owner" | "admin" | "member" | "guest";

export type WorkspacePlan = "free" | "pro" | "enterprise";

export type TicketStatus = "backlog" | "todo" | "in-progress" | "in-review" | "done";

export type TicketPriority = "urgent" | "high" | "medium" | "low" | "none";

export type MeetingStatus = "scheduled" | "live" | "ended";

export type NotificationType =
  | "ticket_assigned"
  | "mentioned"
  | "meeting_starting"
  | "document_shared"
  | "status_changed";

export type ActivityType =
  | "ticket_created"
  | "ticket_updated"
  | "ticket_status_changed"
  | "ticket_assigned"
  | "comment_added"
  | "document_created"
  | "document_updated"
  | "meeting_created"
  | "meeting_started"
  | "meeting_ended";

// --- Core Models -------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo: string;
  members: User[];
  plan: WorkspacePlan;
  invited_emails: string[];
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface StatusDefinition {
  id: string;
  value: TicketStatus;
  name: string;
  color: string;
  order: number;
}

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  ticket_id: string;
  created_at: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  user_id: string;
  ticket_id: string;
  created_at: string;
}

export type TicketParentType = "board" | "ticket";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  content: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string | null;
  created_by: string;
  parent_id: string | null;
  parent_type: TicketParentType | null;
  labels: string[];
  due_date: string | null;
  created_at: string;
  updated_at: string;
  sub_tickets: string[];
  comments: string[];
  workspace_id: string;
}

// Board summary (returned by GET /boards)
export interface BoardSummary {
  id: string;
  name: string;
  workspace_id: string;
  ticket_counts: {
    total: number;
    backlog: number;
    todo: number;
    in_progress: number;
    in_review: number;
    done: number;
  };
  created_at: string;
  updated_at: string;
}

// Ticket summary (returned by GET /api/tickets)
export interface TicketSummary {
  id: string;
  title: string;
  status: TicketStatus;
  due_date: string | null;
  priority: TicketPriority;
  assignee: string | null;
  created_by: string;
  parent_id: string | null;
  parent_type: TicketParentType | null;
  labels: string[];
  sub_ticket_count: number;
}

// Filters for GET /api/tickets
export interface TicketFilters {
  assignees?: string[];
  created_by?: string[];
  statuses?: TicketStatus[];
  priorities?: TicketPriority[];
  labels?: string[];
  search_term?: string;
  parent_id?: string;
  parent_type?: TicketParentType[];
}

// Board detail — same as BoardSummary; tickets fetched separately via GET /api/tickets
export type BoardDetail = BoardSummary;

// Board column — client-side only, computed from ticket statuses
export interface BoardColumn {
  id: string;
  name: string;
  color: string;
  status: TicketStatus;
  order: number;
  tickets: TicketSummary[];
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  participants: string[];
  status: MeetingStatus;
  room_id: string;
  recording_url: string | null;
  workspace_id: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link: string;
  actor_id: string;
}

// --- API Request / Response helpers ------------------------------------------

export interface CreateTicketInput {
  title: string;
  description?: string;
  content?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee?: string | null;
  labels?: string[];
  due_date?: string | null;
  parent_id?: string;
  parent_type?: TicketParentType;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  content?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee?: string | null;
  labels?: string[];
  due_date?: string | null;
}

export interface CreateBoardInput {
  name: string;
}

export interface MoveTicketInput {
  ticket_id: string;
  to_status: TicketStatus;
  index: number;
}

export interface CreateLabelInput {
  name: string;
  color: string;
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
}

export interface CreateMeetingInput {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  participants: string[];
  workspace_id: string;
}

export interface CreateCommentInput {
  content: string;
  author_id: string;
  ticket_id: string;
}

// --- Favorites ---------------------------------------------------------------

export interface Favorite {
  id: string;
  ticket_id: string;
  title: string;
  status: TicketStatus;
  created_at: string;
}

export interface ToggleFavoriteInput {
  ticket_id: string;
}

// --- Invitations -------------------------------------------------------------

export interface InviteToWorkspaceInput {
  email: string;
}

export interface WorkspaceInvitation {
  id: string;
  name: string;
  slug: string;
  logo: string;
  plan: WorkspacePlan;
  member_count: number;
}

// --- Push Notifications ------------------------------------------------------

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}
