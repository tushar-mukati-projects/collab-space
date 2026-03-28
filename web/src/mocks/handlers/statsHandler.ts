import { http, HttpResponse, delay } from "msw";
import { _tickets, _activities } from "../store";
import { mockUsers, mockMeetings } from "../data";
import { mockUrl } from "../config";

export const statsHandlers = [
  http.get(mockUrl("/stats"), async () => {
    await delay(300);

    const now = new Date();
    const users = mockUsers;
    const userMap = new Map(users.map((u) => [u.id, u]));

    const statusCounts: Record<string, number> = {};
    for (const t of _tickets) {
      statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
    }
    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const createdPerDay: Record<string, number> = {};
    for (const t of _tickets) {
      const d = new Date(t.created_at);
      if (d >= thirtyDaysAgo) {
        const day = d.toISOString().split("T")[0];
        createdPerDay[day] = (createdPerDay[day] ?? 0) + 1;
      }
    }

    const dailyCreated: { date: string; count: number }[] = [];
    const cursor = new Date(thirtyDaysAgo);
    while (cursor <= now) {
      const day = cursor.toISOString().split("T")[0];
      dailyCreated.push({ date: day, count: createdPerDay[day] ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    const upcomingDeadlines = _tickets
      .filter(
        (t) =>
          t.due_date &&
          new Date(t.due_date) >= now &&
          new Date(t.due_date) <= sevenDays &&
          t.status !== "done",
      )
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 8)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        assignee: t.assignee
          ? {
              id: t.assignee,
              name: userMap.get(t.assignee)?.name ?? "Unknown",
              avatar: userMap.get(t.assignee)?.avatar ?? "",
            }
          : null,
      }));

    const overdueTickets = _tickets
      .filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== "done")
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        assignee: t.assignee
          ? {
              id: t.assignee,
              name: userMap.get(t.assignee)?.name ?? "Unknown",
              avatar: userMap.get(t.assignee)?.avatar ?? "",
            }
          : null,
      }));

    const sortedActivities = [..._activities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15);

    const activityFeed = sortedActivities.map((a) => {
      const ticket = _tickets.find((t) => t.id === a.ticket_id);
      const user = userMap.get(a.user_id);
      return {
        id: a.id,
        type: a.type,
        message: a.message,
        user: {
          id: a.user_id,
          name: user?.name ?? "Unknown",
          avatar: user?.avatar ?? "",
        },
        ticket: {
          id: a.ticket_id,
          title: ticket?.title ?? "Deleted ticket",
        },
        created_at: a.created_at,
      };
    });

    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const upcomingMeetings = mockMeetings
      .filter((m) => {
        const start = new Date(m.start_time);
        return start >= todayStart && start <= weekEnd;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 10)
      .map((m) => ({
        id: m.id,
        title: m.title,
        start_time: m.start_time,
        end_time: m.end_time,
        status: m.status,
        room_id: m.room_id,
        participant_count: m.participants.length,
        participants: m.participants.slice(0, 4).map((pid) => ({
          id: pid,
          name: userMap.get(pid)?.name ?? "Unknown",
          avatar: userMap.get(pid)?.avatar ?? "",
        })),
      }));

    const memberSummary = users.map((u) => {
      const assigned = _tickets.filter((t) => t.assignee === u.id);
      const completedCount = assigned.filter((t) => t.status === "done").length;
      return {
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        assigned_count: assigned.length,
        completed_count: completedCount,
      };
    });

    const total = _tickets.length;
    const completed = _tickets.filter((t) => t.status === "done").length;
    const inProgress = _tickets.filter((t) => t.status === "in-progress").length;

    return HttpResponse.json({
      summary: {
        total,
        completed,
        in_progress: inProgress,
        overdue: overdueTickets.length,
      },
      byStatus,
      dailyCreated,
      upcomingDeadlines,
      overdueTickets,
      activityFeed,
      upcomingMeetings,
      memberSummary,
    });
  }),
];
