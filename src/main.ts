import { JSDOM } from "jsdom";
import notifier from "node-notifier";
import open from "open";
import { type Browser, type Page, TimeoutError } from "puppeteer";
import puppeteer from "puppeteer-extra";
import PortalPlugin from "puppeteer-extra-plugin-portal";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import config from "../config.js";
import { AllegroOffer } from "./allegro-offer.js";
import type { Offer } from "./offer.js";
import { OLXOffer } from "./olx-offer.js";
import { store } from "./store.js";
import { cleanUpLogsAndScreenshots, getFileNameTimestamp, logError, logMessage, sleep } from "./utils.js";

puppeteer.use(StealthPlugin());
puppeteer.use(
    PortalPlugin({
        webPortalConfig: {
            listenOpts: { port: 3211 },
            baseUrl: "http://localhost:3211"
        }
    })
);

let browser: Browser | null = null;

async function getPageDOM(url: string, retryTries = 10) {
    try {
        const html = await fetch(url, {
            signal: AbortSignal.timeout(5000),
            headers: new Headers({ "User-Agent": config.userAgent })
        }).then(async r => await r.text());
        return new JSDOM(html);
    } catch (error) {
        if (error instanceof Error && error.message === "fetch failed" && retryTries > 0) {
            await sleep(5000);
            logMessage("Network connection error. Retrying...");
            return getPageDOM(url, retryTries - 1);
        }
        throw error;
    }
}

function sendNotification(offer: Offer) {
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

async function saveOffer(id: string, offer: Offer) {
    store.set(id, offer);
    await store.saveToFile();
}

function isOfferNew(offerId: string, offer: Offer) {
    const offerFromStore = store.get(offerId);
    return !offerFromStore || offerFromStore.price !== offer.price;
}

async function handleParsedOffer(offer: Offer, offerId: string) {
    if (!isOfferNew(offerId, offer)) return;

    logMessage(offer.toString());
    sendNotification(offer);

    await saveOffer(offerId, offer);
}

async function handleCaptcha(page: Page, offerListSelector: string) {
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

async function olxResolver(queryUrl: URL) {
    try {
        const { window } = await getPageDOM(queryUrl.toString());
        const offerElementArr = window.document.querySelectorAll('div[data-cy="l-card"]');
        if (offerElementArr.length === 0) logMessage("No offers found!");

        for (const offerElement of offerElementArr) {
            const offer = OLXOffer.fromElement(queryUrl, offerElement);
            await handleParsedOffer(offer, offerElement.id);
        }
    } catch (error) {
        logError(error);
    }
}

async function allegroResolver(queryUrl: URL, triesLeft = 3) {
    const offerListSelector = ".opbox-listing";
    if (!browser) throw new Error("config.useBrowser must be true to resolve allegro.pl");
    const page = await browser.newPage();
    await page.setUserAgent(config.userAgent);

    try {
        await page.goto(queryUrl.toString());

        await page.waitForSelector(offerListSelector, { timeout: 10_000 });
        const offersHtml = await page.$eval(offerListSelector, el => el.innerHTML);

        const { window } = new JSDOM(offersHtml);
        const offerElementArr = window.document.querySelectorAll("article");
        if (offerElementArr.length === 0) logMessage("No offers found!");

        for (const offerElement of offerElementArr) {
            if (offerElement.textContent?.includes("Sponsorowane")) continue;

            const offer = AllegroOffer.fromElement(queryUrl, offerElement);
            await handleParsedOffer(offer, offer.url);
        }
    } catch (error) {
        const err = error as Error;

        if (err.name === TimeoutError.name) {
            const pageTitle = await page.$("title").then(async x => x?.evaluate(el => el.textContent));
            if (pageTitle === "allegro.pl") await handleCaptcha(page, offerListSelector);
            else logMessage(`Selector ${offerListSelector} not found!`);
        } else if (err.message.startsWith("net::ERR_NETWORK_ACCESS_DENIED")) {
            logMessage("Network error!");
            if (triesLeft > 0) {
                await sleep(15000);
                logMessage("Retrying...");
                return allegroResolver(queryUrl, triesLeft - 1);
            }
        } else {
            logError(error);
            await page
                .screenshot({ path: `logs/error-ss-${getFileNameTimestamp()}.jpg`, type: "jpeg" })
                .catch(() => logMessage("Cannot make screenshot!"));
        }
    }
    await page?.close();
}

async function resolveUrl(queryUrl: URL) {
    if (queryUrl.hostname === "www.olx.pl") await olxResolver(queryUrl);
    else if (queryUrl.hostname === "allegro.pl") await allegroResolver(queryUrl);
    else throw new Error(`Unhandled URL hostname: ${queryUrl.hostname}!`);
}

async function checkUrl(queryUrlString: string) {
    const queryUrl = new URL(queryUrlString);
    logMessage(`Checking: ${queryUrl.pathname}`);
    await resolveUrl(queryUrl);
}

async function listen() {
    while (true) {
        logMessage("Searching for changes...");
        if (config.useBrowser) browser = await puppeteer.launch({ headless: true });

        for (const url of config.urlList) {
            await checkUrl(url);
            if (url !== config.urlList.at(-1)) await sleep(config.timeoutAfterOnePage);
        }

        logMessage("Searching finished");
        if (config.useBrowser) await browser?.close();
        await sleep(1000 * 60 * config.intervalMinutes);
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
        if (config.useBrowser) await browser?.close();
    }
}

await main();
