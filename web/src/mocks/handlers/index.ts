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
import { billingHandlers } from "./billingHandler";
import { attachmentHandlers } from "./attachmentHandler";
import { statsHandlers } from "./statsHandler";
import { permissionHandlers } from "./permissionHandler";
import { aiHandlers } from "./aiHandler";

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
  ...billingHandlers,
  ...attachmentHandlers,
  ...statsHandlers,
  ...permissionHandlers,
  ...aiHandlers,
];
