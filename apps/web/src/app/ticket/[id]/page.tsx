"use client";

import { use } from "react";
import { TicketPage } from "@/features/tickets/ticket-page";

export default function TicketRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TicketPage ticketId={id} />;
}
