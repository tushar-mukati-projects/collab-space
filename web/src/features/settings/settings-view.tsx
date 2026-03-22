"use client";

import * as React from "react";
import { User, Building2, Bell, Palette } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileSettings } from "./profile-settings";
import { WorkspaceSettings } from "./workspace-settings";
import { NotificationSettings } from "./notification-settings";
import { AppearanceSettings } from "./appearance-settings";

export const SettingsView = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="border-border bg-background/80 border-b px-4 py-3 backdrop-blur-sm">
        <h2 className="text-lg font-bold tracking-tight">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-4">
        <div className="animate-fade-in mx-auto max-w-2xl">
          <Tabs defaultValue="profile">
            <TabsList className="mb-6 w-full sm:w-auto">
              <TabsTrigger value="profile">
                <User className="size-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="workspace">
                <Building2 className="size-4" />
                <span className="hidden sm:inline">Workspace</span>
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="size-4" />
                <span className="hidden sm:inline">Notifications</span>
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
            <TabsContent value="notifications">
              <NotificationSettings />
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
