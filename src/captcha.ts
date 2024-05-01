import open from "open";
import notifier from "node-notifier";
import type { Page } from "puppeteer";

import { logMessage } from "./utils";

export async function handleCaptcha(page: Page) {
    logMessage("Captcha need to be solved!");
    await page.waitForSelector("iframe");
    const src = await page.$eval("iframe", el => el.getAttribute("src"));
    if (!src) throw Error("No src address in iframe!");

    await page.goto(src);

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

    await page.waitForSelector("#captcha__element.captcha-success", { timeout: 120_000 }).catch(() => {
        throw new Error("Captcha not solved!");
    });

    logMessage("Captcha solved successfully.");
    await page.closePortal();
    await page.close();
}
