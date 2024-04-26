import type {} from "node-notifier";

declare module "node-notifier" {
    interface NotificationMetadata {
        action?: string | undefined;
    }
}
