import { Page, type Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import PortalPlugin from "puppeteer-extra-plugin-portal";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import config from "../config.js";
import { allegroResolver } from "./allegro-resolver.js";
import { olxResolver } from "./olx-resolver.js";
import { store } from "./store.js";
import { cleanUpLogsAndScreenshots, logMessage, sleep } from "./utils.js";

puppeteer.use(StealthPlugin());
puppeteer.use(
    PortalPlugin({
        webPortalConfig: {
            listenOpts: { port: 3211 },
            baseUrl: "http://localhost:3211"
        }
    })
);

async function checkUrl(queryUrlString: string, browser: Browser | null) {
    const queryUrl = new URL(queryUrlString);
    logMessage(`Checking: ${queryUrl.pathname}`);

    if (queryUrl.hostname === "www.olx.pl") await olxResolver(queryUrl);
    else if (queryUrl.hostname === "allegro.pl") {
        if (!browser) throw new Error("config.useBrowser must be true to resolve allegro.pl");
        const page = await browser.newPage();
        await page.setUserAgent(config.userAgent);
        await allegroResolver(queryUrl, page);
        await page.close();
    } else throw new Error(`Unhandled URL hostname: ${queryUrl.hostname}!`);
}

async function listen() {
    while (true) {
        let browser: Browser | null = null;
        try {
            logMessage("Searching for changes...");
            if (config.useBrowser) browser = await puppeteer.launch({ headless: true });

            for (const url of config.urlList) {
                await checkUrl(url, browser);
                if (url !== config.urlList.at(-1)) await sleep(config.timeoutAfterOnePage);
            }
            logMessage("Searching finished");

            if (config.useBrowser) await browser?.close();
            await sleep(1000 * 60 * config.intervalMinutes);
        } catch (error) {
            if (config.useBrowser) await browser?.close();
            throw error;
        }
    }
}

async function main() {
    try {
        cleanUpLogsAndScreenshots();
        logMessage("Starting...");

        await store.loadFromFile();
        await listen();
    } catch (error) {
        if (error instanceof Error) {
            logMessage(error.stack || `${error.name}: ${error.message}`);
        } else {
            logMessage(`Unexpected error: ${String(error)}`);
            throw error;
        }
    } finally {
        logMessage("Exit...");
    }
}

await main();
