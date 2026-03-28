"use client";

import * as React from "react";
import { Check, CreditCard, ExternalLink, Loader2, AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFetchSubscription, useCreateCheckout, useCreatePortal } from "@/hooks/billing";
import { usePermission, PERMISSION_LABEL } from "@/hooks/usePermission";
import type { WorkspacePlan } from "@/types";

interface PlanConfig {
  name: string;
  key: WorkspacePlan;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const plans: PlanConfig[] = [
  {
    name: "Free",
    key: "free",
    price: "$0",
    period: "forever",
    description: "For individuals and small experiments.",
    features: [
      "Up to 3 members",
      "1 board",
      "50 tickets",
      "Basic collaboration",
      "Community support",
    ],
  },
  {
    name: "Pro",
    key: "pro",
    price: "$12",
    period: "per member / month",
    description: "For growing teams that need full power.",
    features: [
      "Unlimited members",
      "Unlimited boards",
      "Unlimited tickets",
      "Real-time collaboration",
      "Priority support",
      "Advanced filters & search",
      "Custom labels & statuses",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    key: "enterprise",
    price: "$29",
    period: "per member / month",
    description: "For organizations with advanced needs.",
    features: [
      "Everything in Pro",
      "SSO / SAML authentication",
      "Audit logs",
      "Advanced admin controls",
      "Custom integrations",
      "Dedicated support",
      "99.9% uptime SLA",
    ],
  },
];

const statusLabels: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  past_due: {
    label: "Past Due",
    className: "bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  },
  canceled: {
    label: "Canceled",
    className: "bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400",
  },
  trialing: {
    label: "Trial",
    className: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  none: {
    label: "No subscription",
    className: "bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400",
  },
};

const BillingSkeleton = () => (
  <div className="animate-fade-in flex flex-col gap-6">
    {[1, 2].map((i) => (
      <div key={i} className="border-border bg-card space-y-4 rounded-xl border p-6">
        <div className="skeleton-shimmer bg-muted h-5 w-32 rounded" />
        <div className="skeleton-shimmer bg-muted h-3 w-48 rounded" />
        <div className="bg-border h-px" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((j) => (
            <div key={j} className="skeleton-shimmer bg-muted h-48 rounded-xl" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const BillingSettings = () => {
  const { data: subscription, isLoading } = useFetchSubscription();
  const checkoutMutation = useCreateCheckout();
  const portalMutation = useCreatePortal();
  const canBilling = usePermission("billing:manage");
  const billingTitle = !canBilling ? `Requires: ${PERMISSION_LABEL["billing:manage"]}` : undefined;

  const handleUpgrade = (plan: "pro" | "enterprise") => {
    if (!canBilling) return;
    checkoutMutation.mutate({ plan }, { onError: () => toast.error("Failed to start checkout") });
  };

  const handleManageBilling = () => {
    if (!canBilling) return;
    portalMutation.mutate(undefined, {
      onError: () => toast.error("Failed to open billing portal"),
    });
  };

  if (isLoading || !subscription) {
    return <BillingSkeleton />;
  }

  const currentPlan = subscription.plan;
  const status = statusLabels[subscription.status] ?? statusLabels.none;
  const planIndex = plans.findIndex((p) => p.key === currentPlan);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and billing status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {plans.find((p) => p.key === currentPlan)?.name ?? "Free"} Plan
              </span>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
            {subscription.current_period_end && (
              <span className="text-muted-foreground text-xs">
                {subscription.status === "canceled" ? "Access until" : "Renews"}{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          {subscription.status === "past_due" && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
              <div className="text-xs text-red-700 dark:text-red-300">
                Your payment is past due. Please update your payment method to avoid service
                interruption.
              </div>
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <CreditCard className="size-3.5" />
              <span>
                {subscription.member_count} member{subscription.member_count !== 1 ? "s" : ""}
              </span>
            </div>
            {subscription.has_subscription && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={!canBilling || portalMutation.isPending}
                title={billingTitle}
              >
                {portalMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="size-3.5" />
                )}
                Manage Billing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>Choose the plan that fits your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan, index) => {
              const isCurrent = plan.key === currentPlan;
              const isUpgrade = index > planIndex;
              const isDowngrade = index < planIndex;
              const isCheckingOut =
                checkoutMutation.isPending && checkoutMutation.variables?.plan === plan.key;

              return (
                <div
                  key={plan.key}
                  className={cn(
                    "relative flex flex-col rounded-xl border p-4 transition-all",
                    plan.highlighted && !isCurrent
                      ? "border-indigo-500/40 shadow-[0_0_0_1px_rgba(99,102,241,0.15)] dark:border-indigo-500/30"
                      : "border-border",
                    isCurrent && "border-foreground/20 bg-muted/30",
                  )}
                >
                  {plan.highlighted && !isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                        <Zap className="size-3" />
                        Popular
                      </Badge>
                    </div>
                  )}

                  <div className="mb-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{plan.name}</span>
                      {isCurrent && (
                        <Badge className="bg-foreground/10 text-foreground text-[10px]">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tracking-tight">{plan.price}</span>
                      <span className="text-muted-foreground text-xs">{plan.period}</span>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <Separator className="mb-3" />

                  <ul className="mb-4 flex flex-1 flex-col gap-1.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs">
                        <Check className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" size="sm" disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleUpgrade(plan.key as "pro" | "enterprise")}
                      disabled={!canBilling || checkoutMutation.isPending}
                      title={billingTitle}
                    >
                      {isCheckingOut ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Zap className="size-3.5" />
                      )}
                      Upgrade to {plan.name}
                    </Button>
                  ) : isDowngrade && subscription.has_subscription ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleManageBilling}
                      disabled={!canBilling || portalMutation.isPending}
                      title={billingTitle}
                    >
                      {portalMutation.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : null}
                      Downgrade
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled className="w-full">
                      {plan.name}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
