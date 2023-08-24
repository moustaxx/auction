// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type notifier from 'node-notifier';

declare module 'node-notifier' {
    interface NotificationMetadata {
        action?: string | undefined;
    }
}
