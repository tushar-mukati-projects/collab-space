import { http, HttpResponse, delay } from "msw";
import { mockUrl } from "../config";
import { _workspaces } from "../store";
import type { SubscriptionInfo, CheckoutInput } from "@/types";

export const billingHandlers = [
  http.get(mockUrl("/billing/subscription"), async () => {
    await delay(200);
    const workspace = _workspaces[0];
    if (!workspace) {
      return HttpResponse.json({ error: "No workspace" }, { status: 404 });
    }

    const info: SubscriptionInfo = {
      plan: workspace.plan,
      status: workspace.plan === "free" ? "none" : "active",
      current_period_end:
        workspace.plan === "free"
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      member_count: workspace.members.length,
      has_subscription: workspace.plan !== "free",
    };
    return HttpResponse.json(info);
  }),

  http.post(mockUrl("/billing/checkout"), async ({ request }) => {
    await delay(400);
    const { plan } = (await request.json()) as CheckoutInput;

    const workspace = _workspaces[0];
    if (workspace) {
      workspace.plan = plan;
    }

    // In mock mode, simulate successful checkout by returning current page
    return HttpResponse.json({
      url: `${window.location.origin}/settings?tab=billing&status=success`,
    });
  }),

  http.post(mockUrl("/billing/portal"), async () => {
    await delay(400);
    // In mock mode, redirect back to billing settings
    return HttpResponse.json({
      url: `${window.location.origin}/settings?tab=billing`,
    });
  }),
];
