import notifier from "node-notifier";
import type { Page } from "puppeteer";

import { logMessage } from "./utils";

export async function handleCaptcha(page: Page, offerListSelector: string) {
    logMessage("Captcha need to be solved!");
    const portalUrl = await page.openPortal();
    logMessage(`Portal URL: ${portalUrl}`);

    notifier.notify(
        {
            title: "Captcha need to be solved!",
            message: "Click to open in browser."
        },
        (error, response, metadata) => {
            if (metadata?.action === "clicked") {
                logMessage("Opening portal...");
                void open(portalUrl);
            }
            if (error) logMessage(`Notification: ${String(error)}`);
        }
    );

    await page.waitForSelector(offerListSelector, { timeout: 120_000 }).catch(() => {
        throw new Error("Captcha not solved!");
    });
    await page.closePortal();
}
