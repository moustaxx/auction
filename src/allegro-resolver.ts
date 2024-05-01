import { JSDOM } from "jsdom";
import { type Browser, TimeoutError } from "puppeteer";

import config from "../config.js";
import { handleCaptcha } from "./captcha";
import { type Offer, handleParsedOffer } from "./offer";
import { getFileNameTimestamp, logError, logMessage, sleep } from "./utils";

function fromElement(el: Element) {
    const title = el.getElementsByTagName("h2")[0]?.textContent || "Unknown title";

    const priceText = el.querySelector('span[data-test-tag="price-container"]')?.textContent || "";
    const price = Number.parseFloat(priceText);
    if (Number.isNaN(price)) logMessage("Price is NaN!");

    const url = el.getElementsByTagName("h2")[0]?.firstElementChild?.getAttribute("href") || "";
    if (!url) logMessage("URL is undefined!");

    // newOffer.isAuction = !!el.textContent?.includes('LICYTACJA');
    return { title, price, dateAdded: null, url } as Offer;
}

export async function allegroResolver(queryUrl: URL, browser: Browser | null, triesLeft = 3) {
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

            const offer = fromElement(offerElement);
            await handleParsedOffer(offer, offer.url);
        }
    } catch (error) {
        const err = error as Error;

        if (err.name === TimeoutError.name) {
            const pageTitle = await page.$("title").then(async x => x?.evaluate(el => el.textContent));
            if (pageTitle === "allegro.pl") {
                await handleCaptcha(page);
                return allegroResolver(queryUrl, browser, triesLeft - 1);
            }
            logMessage(`Selector ${offerListSelector} not found!`);
        } else if (
            err.message.startsWith("net::ERR_NETWORK_ACCESS_DENIED") ||
            err.message.startsWith("net::ERR_INTERNET_DISCONNECTED")
        ) {
            logMessage("Network error!");
            if (triesLeft > 0) {
                await sleep(15000);
                logMessage("Retrying...");
                await page.close();
                return allegroResolver(queryUrl, browser, triesLeft - 1);
            }
        } else {
            logError(error);
            await page
                .screenshot({
                    path: `logs/error-ss-${getFileNameTimestamp()}.jpg`,
                    type: "jpeg",
                    fullPage: true
                })
                .catch(() => logMessage("Cannot make screenshot!"));
        }
    }
    await page?.close();
}
