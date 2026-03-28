import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

interface DeadlineTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  assignee: { id: string; name: string; avatar: string } | null;
}

interface ActivityFeedItem {
  id: string;
  type: string;
  message: string;
  user: { id: string; name: string; avatar: string };
  ticket: { id: string; title: string };
  created_at: string;
}

interface UpcomingMeeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  room_id: string;
  participant_count: number;
  participants: { id: string; name: string; avatar: string }[];
}

interface MemberSummary {
  id: string;
  name: string;
  avatar: string;
  assigned_count: number;
  completed_count: number;
}

export interface DashboardStats {
  summary: {
    total: number;
    completed: number;
    in_progress: number;
    overdue: number;
  };
  byStatus: { status: string; count: number }[];
  dailyCreated: { date: string; count: number }[];
  upcomingDeadlines: DeadlineTicket[];
  overdueTickets: DeadlineTicket[];
  activityFeed: ActivityFeedItem[];
  upcomingMeetings: UpcomingMeeting[];
  memberSummary: MemberSummary[];
}

export const useFetchStats = () => {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await axiosInstance.get<DashboardStats>("/stats");
      return response.data;
    },
  });
};
