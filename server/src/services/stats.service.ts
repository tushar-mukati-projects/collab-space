import { prisma } from "../db.js";
import { serializeStatus } from "../utils.js";

export const getWorkspaceStats = async (workspaceId: string) => {
  const now = new Date();

  const [tickets, users, recentActivities, meetings] = await Promise.all([
    prisma.ticket.findMany({
      where: { workspace_id: workspaceId },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        assignee_id: true,
        due_date: true,
        created_at: true,
        labels: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.user.findMany({
      where: { memberships: { some: { workspace_id: workspaceId } } },
      select: { id: true, name: true, avatar: true },
    }),
    prisma.activity.findMany({
      where: {
        ticket: { workspace_id: workspaceId },
      },
      orderBy: { created_at: "desc" },
      take: 15,
      select: {
        id: true,
        type: true,
        message: true,
        user_id: true,
        ticket_id: true,
        created_at: true,
        ticket: { select: { title: true } },
      },
    }),
    prisma.meeting.findMany({
      where: {
        workspace_id: workspaceId,
        start_time: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
        },
      },
      include: { participants: { select: { id: true } } },
      orderBy: { start_time: "asc" },
      take: 10,
    }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Tickets by status
  const statusCounts: Record<string, number> = {};
  for (const t of tickets) {
    const s = serializeStatus(t.status);
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }
  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  // Tickets created per day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTickets = tickets.filter((t) => t.created_at >= thirtyDaysAgo);

  const createdPerDay: Record<string, number> = {};
  for (const t of recentTickets) {
    const day = t.created_at.toISOString().split("T")[0];
    createdPerDay[day] = (createdPerDay[day] ?? 0) + 1;
  }

  const dailyCreated: { date: string; count: number }[] = [];
  const cursor = new Date(thirtyDaysAgo);
  const today = new Date();
  while (cursor <= today) {
    const day = cursor.toISOString().split("T")[0];
    dailyCreated.push({ date: day, count: createdPerDay[day] ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const toDeadlineItem = (t: (typeof tickets)[number]) => ({
    id: t.id,
    title: t.title,
    status: serializeStatus(t.status),
    priority: t.priority,
    due_date: t.due_date,
    assignee: t.assignee_id
      ? {
          id: t.assignee_id,
          name: userMap.get(t.assignee_id)?.name ?? "Unknown",
          avatar: userMap.get(t.assignee_id)?.avatar ?? "",
        }
      : null,
  });

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const upcomingDeadlines = tickets
    .filter(
      (t) =>
        t.due_date && t.due_date >= now && t.due_date <= sevenDaysFromNow && t.status !== "done",
    )
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 8)
    .map(toDeadlineItem);

  const overdueTickets = tickets
    .filter((t) => t.due_date && t.due_date < now && t.status !== "done")
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5)
    .map(toDeadlineItem);

  // Recent activity feed
  const activityFeed = recentActivities.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    user: userMap.get(a.user_id)
      ? {
          id: a.user_id,
          name: userMap.get(a.user_id)!.name,
          avatar: userMap.get(a.user_id)!.avatar,
        }
      : { id: a.user_id, name: "Unknown", avatar: "" },
    ticket: { id: a.ticket_id, title: a.ticket.title },
    created_at: a.created_at,
  }));

  // Meetings this week
  const upcomingMeetings = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    start_time: m.start_time,
    end_time: m.end_time,
    status: m.status,
    room_id: m.room_id,
    participant_count: m.participants.length,
    participants: m.participants.slice(0, 4).map((p) => ({
      id: p.id,
      name: userMap.get(p.id)?.name ?? "Unknown",
      avatar: userMap.get(p.id)?.avatar ?? "",
    })),
  }));

  // Members summary
  const memberSummary = users.map((u) => {
    const assigned = tickets.filter((t) => t.assignee_id === u.id);
    const completedCount = assigned.filter((t) => t.status === "done").length;
    return {
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      assigned_count: assigned.length,
      completed_count: completedCount,
    };
  });

  // Summary
  const total = tickets.length;
  const completed = tickets.filter((t) => t.status === "done").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const overdue = overdueTickets.length;

  return {
    summary: { total, completed, in_progress: inProgress, overdue },
    byStatus,
    dailyCreated,
    upcomingDeadlines,
    overdueTickets,
    activityFeed,
    upcomingMeetings,
    memberSummary,
  };
};
