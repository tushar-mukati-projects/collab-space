import { userHandlers } from "./userHandler";
import { workspaceHandlers } from "./workspaceHandler";
import { ticketHandlers } from "./ticketHandler";
import { boardHandlers } from "./boardHandler";
import { meetingHandlers } from "./meetingHandler";
import { notificationHandlers } from "./notificationHandler";
import { labelHandlers } from "./labelHandler";
import { statusHandlers } from "./statusHandler";
import { settingsHandlers } from "./settingsHandler";
import { favoriteHandlers } from "./favoriteHandler";

export const handlers = [
  ...userHandlers,
  ...workspaceHandlers,
  ...ticketHandlers,
  ...boardHandlers,
  ...meetingHandlers,
  ...notificationHandlers,
  ...labelHandlers,
  ...statusHandlers,
  ...settingsHandlers,
  ...favoriteHandlers,
];
