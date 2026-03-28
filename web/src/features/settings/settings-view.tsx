"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { User, Building2, Bell, Palette, CreditCard, Shield } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileSettings } from "./profile-settings";
import { WorkspaceSettings } from "./workspace-settings";
import { NotificationSettings } from "./notification-settings";
import { AppearanceSettings } from "./appearance-settings";
import { BillingSettings } from "./billing-settings";
import { PermissionsSettings } from "./permissions-settings";

export const SettingsView = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = tabParam === "billing" ? "billing" : "profile";

  return (
    <div className="flex h-full flex-col">
      <div className="border-border bg-background/80 border-b px-6 py-4 backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="animate-fade-in mx-auto max-w-2xl">
          <Tabs defaultValue={defaultTab}>
            <TabsList className="mb-5 w-full sm:w-auto">
              <TabsTrigger value="profile">
                <User className="size-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="workspace">
                <Building2 className="size-4" />
                <span className="hidden sm:inline">Workspace</span>
              </TabsTrigger>
              <TabsTrigger value="billing">
                <CreditCard className="size-4" />
                <span className="hidden sm:inline">Billing</span>
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="size-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="permissions">
                <Shield className="size-4" />
                <span className="hidden sm:inline">Permissions</span>
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <Palette className="size-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileSettings />
            </TabsContent>
            <TabsContent value="workspace">
              <WorkspaceSettings />
            </TabsContent>
            <TabsContent value="billing">
              <BillingSettings />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationSettings />
            </TabsContent>
            <TabsContent value="permissions">
              <PermissionsSettings />
            </TabsContent>
            <TabsContent value="appearance">
              <AppearanceSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
