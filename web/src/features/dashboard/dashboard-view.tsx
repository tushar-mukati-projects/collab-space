"use client";

import Link from "next/link";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useFetchStats } from "@/hooks/stats";
import {
  CheckCircle2,
  Clock,
  LayoutList,
  AlertTriangle,
  CalendarClock,
  Video,
  Users,
  Circle,
  CircleDashed,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const STATUS_COLORS: Record<string, string> = {
  backlog: "#6b7280",
  todo: "#3b82f6",
  "in-progress": "#f59e0b",
  "in-review": "#8b5cf6",
  done: "#10b981",
};

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "Todo",
  "in-progress": "In Progress",
  "in-review": "In Review",
  done: "Done",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  backlog: CircleDashed,
  todo: Circle,
  "in-progress": Clock,
  "in-review": Eye,
  done: CheckCircle2,
};

// --- Shared components ---

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

const StatCard = ({ label, value, icon: Icon, color, subtitle }: StatCardProps) => (
  <div className="border-border/60 bg-card rounded-2xl border p-5 shadow-xs transition-all hover:shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
        {subtitle && <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>}
      </div>
      <div className={cn("rounded-xl p-2.5", color)}>
        <Icon className="size-5 text-white" />
      </div>
    </div>
  </div>
);

const Card = ({
  title,
  icon: Icon,
  children,
  className,
  action,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) => (
  <div className={cn("border-border/60 bg-card rounded-2xl border shadow-xs", className)}>
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="text-muted-foreground size-4" />}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {action}
    </div>
    <div className="px-5 pb-5">{children}</div>
  </div>
);

interface TooltipPayloadEntry {
  color?: string;
  name?: string;
  value?: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border/60 bg-background rounded-xl border px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{label}</p>
      {payload.map((entry: TooltipPayloadEntry, i: number) => (
        <p key={i} style={{ color: entry.color }} className="mt-0.5">
          {entry.name ?? "Count"}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6">
    <div className="skeleton-shimmer bg-muted h-8 w-36 rounded-lg" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border-border bg-card rounded-2xl border p-5">
          <div className="skeleton-shimmer bg-muted mb-2 h-3 w-20 rounded" />
          <div className="skeleton-shimmer bg-muted h-8 w-16 rounded" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-border bg-card rounded-2xl border p-5">
          <div className="skeleton-shimmer bg-muted mb-4 h-4 w-32 rounded" />
          <div className="skeleton-shimmer bg-muted h-48 w-full rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

const getUserInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

const formatDueLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d");
};

// --- Main Component ---

export const DashboardView = () => {
  const { data: stats, isLoading } = useFetchStats();

  if (isLoading || !stats) return <DashboardSkeleton />;

  const completionRate =
    stats.summary.total > 0 ? Math.round((stats.summary.completed / stats.summary.total) * 100) : 0;

  const statusData = stats.byStatus.map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    fill: STATUS_COLORS[s.status] ?? "#6b7280",
  }));

  const trendData = stats.dailyCreated.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    tickets: d.count,
  }));

  return (
    <div className="animate-fade-in mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Tickets"
          value={stats.summary.total}
          icon={LayoutList}
          color="bg-blue-500"
        />
        <StatCard
          label="In Progress"
          value={stats.summary.in_progress}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          label="Completed"
          value={stats.summary.completed}
          icon={CheckCircle2}
          color="bg-emerald-500"
          subtitle={`${completionRate}% completion rate`}
        />
        <StatCard
          label="Overdue"
          value={stats.summary.overdue}
          icon={AlertTriangle}
          color={stats.summary.overdue > 0 ? "bg-red-500" : "bg-zinc-400"}
          subtitle={stats.summary.overdue > 0 ? "needs attention" : "all on track"}
        />
      </div>

      {/* Row: Status Chart + Activity Feed + Meetings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Status Donut */}
        <Card title="Tickets by Status">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-foreground text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity">
          {stats.activityFeed.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">No recent activity</p>
          ) : (
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {stats.activityFeed.map((item) => (
                <Link
                  key={item.id}
                  href={`/ticket/${item.ticket.id}`}
                  className="hover:bg-accent/40 flex items-start gap-2.5 rounded-xl p-2 transition-colors"
                >
                  <Avatar size="sm" className="mt-0.5 size-6 shrink-0">
                    <AvatarImage src={item.user.avatar} />
                    <AvatarFallback className="text-[9px]">
                      {getUserInitials(item.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs">
                      <span className="font-medium">{item.user.name}</span>{" "}
                      <span className="text-muted-foreground">{item.message}</span>
                    </p>
                    <p className="text-muted-foreground mt-0.5 truncate text-[10px]">
                      {item.ticket.title} &middot;{" "}
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Meetings This Week */}
        <Card title="Meetings This Week" icon={Video}>
          {stats.upcomingMeetings.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center py-8 text-center text-sm">
              <Video className="mb-2 size-8 opacity-20" />
              <p>No meetings scheduled</p>
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {stats.upcomingMeetings.map((m) => (
                <Link
                  key={m.id}
                  href={`/meetings/${m.id}`}
                  className="border-border/50 hover:border-primary/30 hover:bg-accent/30 block rounded-xl border p-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{m.title}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        m.status === "live"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {m.status === "live" ? "Live" : format(new Date(m.start_time), "h:mm a")}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-muted-foreground text-[11px]">
                      {format(new Date(m.start_time), "EEE, MMM d")}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-1.5">
                        {m.participants.map((p) => (
                          <Avatar key={p.id} size="sm" className="ring-card size-5 ring-2">
                            <AvatarImage src={p.avatar} />
                            <AvatarFallback className="text-[8px]">
                              {getUserInitials(p.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {m.participant_count > 4 && (
                        <span className="text-muted-foreground text-[10px]">
                          +{m.participant_count - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Row: Trend Chart + Deadlines */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Trend — 3 cols */}
        <Card title="Ticket Activity (30 days)" className="lg:col-span-3">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tickets"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                  name="Created"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Upcoming Deadlines — 2 cols */}
        <Card title="Upcoming Deadlines" icon={CalendarClock} className="lg:col-span-2">
          {stats.upcomingDeadlines.length === 0 && stats.overdueTickets.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center py-8 text-center text-sm">
              <CalendarClock className="mb-2 size-8 opacity-20" />
              <p>No upcoming deadlines</p>
            </div>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {/* Overdue first */}
              {stats.overdueTickets.map((t) => {
                const StatusIcon = STATUS_ICONS[t.status] ?? Circle;
                return (
                  <Link
                    key={t.id}
                    href={`/ticket/${t.id}`}
                    className="hover:bg-accent/40 flex items-center gap-2.5 rounded-xl p-2 transition-colors"
                  >
                    <StatusIcon
                      className={cn(
                        "size-3.5 shrink-0",
                        STATUS_COLORS[t.status]
                          ? `text-[${STATUS_COLORS[t.status]}]`
                          : "text-muted-foreground",
                      )}
                      style={{ color: STATUS_COLORS[t.status] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{t.title}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                      Overdue
                    </span>
                  </Link>
                );
              })}
              {/* Upcoming */}
              {stats.upcomingDeadlines.map((t) => {
                const StatusIcon = STATUS_ICONS[t.status] ?? Circle;
                const dueLabel = formatDueLabel(t.due_date);
                const isUrgent = isToday(new Date(t.due_date));
                return (
                  <Link
                    key={t.id}
                    href={`/ticket/${t.id}`}
                    className="hover:bg-accent/40 flex items-center gap-2.5 rounded-xl p-2 transition-colors"
                  >
                    <StatusIcon
                      className="size-3.5 shrink-0"
                      style={{ color: STATUS_COLORS[t.status] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{t.title}</p>
                    </div>
                    {t.assignee && (
                      <Avatar size="sm" className="size-5 shrink-0">
                        <AvatarImage src={t.assignee.avatar} />
                        <AvatarFallback className="text-[8px]">
                          {getUserInitials(t.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        isUrgent
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {dueLabel}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Row: Team Members */}
      <Card title="Team Overview" icon={Users}>
        {stats.memberSummary.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No members</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stats.memberSummary.map((m) => {
              const rate =
                m.assigned_count > 0 ? Math.round((m.completed_count / m.assigned_count) * 100) : 0;
              return (
                <div
                  key={m.id}
                  className="border-border/50 flex items-center gap-3 rounded-xl border p-3"
                >
                  <Avatar size="sm" className="size-9 shrink-0">
                    <AvatarImage src={m.avatar} />
                    <AvatarFallback className="text-xs">{getUserInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
                      <span>{m.assigned_count} assigned</span>
                      <span>&middot;</span>
                      <span className="text-emerald-500">{m.completed_count} done</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold">{rate}%</span>
                    <div className="bg-muted mt-1 h-1 w-10 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
