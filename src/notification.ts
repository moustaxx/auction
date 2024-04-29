import notifier from "node-notifier";
import open from "open";

import type { Offer } from "./offer";
import { logMessage } from "./utils";

export function sendNotification(offer: Offer) {
    const date =
        offer.dateAdded?.toLocaleTimeString() === "00:00:00"
            ? offer.dateAdded.toLocaleDateString()
            : offer.dateAdded?.toLocaleString();

    notifier.notify(
        {
            title: `New: ${offer.title}`,
            message: date ? `${date} - ${offer.price} zł` : `${offer.price} zł`
        },
        (error, response, metadata) => {
            if (metadata?.action === "clicked") {
                logMessage(`Clicked: ${offer.title}`);
                void open(offer.url);
            }
            if (error) logMessage(`Notification: ${String(error)}`);
        }
    );
}
