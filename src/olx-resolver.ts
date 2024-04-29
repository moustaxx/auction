import { JSDOM } from "jsdom";

import config from "../config.js";
import { type Offer, handleParsedOffer } from "./offer";
import { logError, logMessage, sleep } from "./utils";

// function parseDate(dateStr: string) {
//     const [day, monthText, year] = dateStr.split(' ');
//     if (day === 'Dzisiaj') return new Date();

//     const month: number | undefined = config.months[monthText as keyof typeof config.months];
//     if (!Number.isInteger(month)) throw new Error(`Unknown month name: ${monthText}, ${dateStr}`);

//     return new Date(Date.parse(`${year}-${month}-${day}`));
// }

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

function fromElement(queryUrl: URL, el: Element) {
    const title = el.getElementsByTagName("h6")[0]?.textContent || "Unknown title";

    const priceText = el.querySelector('p[data-testid="ad-price"]')?.textContent?.replace(" ", "") || "";
    let price = Number.parseFloat(priceText);
    if (Number.isNaN(price)) price = Number.parseFloat(priceText.match(/\d+ zł/)?.at(0) || "");
    if (Number.isNaN(price)) logMessage("Price is NaN!");

    const dateStr = el.querySelector('p[data-testid="location-date"]')?.textContent?.split(" - ", 2).at(1);
    if (!dateStr) logMessage("No date found!");
    // const dateAdded = dateStr ? this.parseDate(dateStr) : null;

    const pathname = el.getElementsByTagName("a")[0]?.getAttribute("href");
    if (!pathname) logMessage("Pathname is undefined!");
    const url = `https://${queryUrl.hostname}/${pathname || ""}`;

    return { title, price, dateAdded: null, url } as Offer;
}

export async function olxResolver(queryUrl: URL) {
    try {
        const { window } = await getPageDOM(queryUrl.toString());
        const offerElementArr = window.document.querySelectorAll('div[data-cy="l-card"]');
        if (offerElementArr.length === 0) logMessage("No offers found!");

        for (const offerElement of offerElementArr) {
            const offer = fromElement(queryUrl, offerElement);
            await handleParsedOffer(offer, offerElement.id);
        }
    } catch (error) {
        logError(error);
    }
}
