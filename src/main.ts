import { JSDOM } from 'jsdom';
import notifier from 'node-notifier';
import open from 'open';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { type Browser } from 'puppeteer';

import config from '../config.js';
import { store } from './store.js';
import { clearLogFile, logMessage, sleep } from './utils.js';
import { type Offer } from './offer.js';
import { OLXOffer } from './olx-offer.js';
import { AllegroOffer } from './allegro-offer.js';

puppeteer.use(StealthPlugin());
let browser: Browser;

async function getPageDOM(url: string) {
    const html = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: new Headers({ 'User-Agent': config.userAgent })
    }).then(async r => await r.text());

    return new JSDOM(html);
}

function sendNotification(offer: Offer) {
    const date = offer.dateAdded?.toLocaleTimeString() === '00:00:00'
        ? offer.dateAdded.toLocaleDateString()
        : offer.dateAdded?.toLocaleString();

    notifier.notify({
        title: 'New: ' + offer.title,
        message: date ? `${date} - ${offer.price} zł` : `${offer.price} zł`
    }, (error, response, metadata) => {
        if (metadata?.action === 'clicked') {
            logMessage('Clicked: ' + offer.title);
            void open(offer.url);
        }
        if (error) logMessage('Notification: ' + String(error));
    });
}

async function saveOffer(id: number, offer: Offer) {
    store.set(id, offer);
    await store.saveToFile();
}

function isOfferNew(offerId: number, offer: Offer) {
    const offerFromStore = store.get(offerId);
    return !offerFromStore || offerFromStore.price !== offer.price;
}

function parseOfferId(offerIdString: string) {
    if (!offerIdString) throw new Error('Offer must have a distinctive id!');
    return Number.parseInt(offerIdString);
}

async function handleParsedOffer(offer: Offer, offerId: number) {
    if (!isOfferNew(offerId, offer)) return;

    logMessage('Change detected!');
    logMessage(offer.toString());
    sendNotification(offer);

    await saveOffer(offerId, offer);
}

async function resolveUrl(queryUrl: URL) {
    if (queryUrl.hostname === 'www.olx.pl') {
        const { window } = await getPageDOM(queryUrl.toString());
        const offerElementArr = window.document.querySelectorAll('div[data-cy="l-card"]');
        if (offerElementArr.length === 0) logMessage('No offers found!');

        for (const offerElement of offerElementArr) {
            const offerId = parseOfferId(offerElement.id);
            const offer = OLXOffer.fromElement(queryUrl, offerElement);
            await handleParsedOffer(offer, offerId);
        }
    }
    else if (queryUrl.hostname === 'allegro.pl') {
        if (browser === null) throw new Error('config.useBrowser must be true to resolve allegro.pl');
        const page = await browser.newPage();
        await page.goto(queryUrl.toString());

        await page.waitForSelector('.opbox-listing');
        const html = await page.$eval('.opbox-listing', el => el.innerHTML);
        await page.close();

        const { window } = new JSDOM(html);
        const offerElementArr = window.document.querySelectorAll('article');
        if (offerElementArr.length === 0) logMessage('No offers found!');

        for (const offerElement of offerElementArr) {
            if (offerElement.textContent?.includes('Sponsorowane')) continue;

            const offerId = parseOfferId(offerElement.dataset.analyticsViewValue || '');
            const offer = AllegroOffer.fromElement(queryUrl, offerElement);
            await handleParsedOffer(offer, offerId);
        }
    }
    else throw new Error(`Unhandled URL hostname: ${queryUrl.hostname}!`);
}

async function checkUrl(queryUrlString: string) {
    const queryUrl = new URL(queryUrlString);
    logMessage('Checking: ' + queryUrl.pathname);
    await resolveUrl(queryUrl);
}

async function listen() {
    while (true) {
        logMessage('Searching for changes...');
        if (config.useBrowser) browser = await puppeteer.launch({ headless: 'new' });

        for (const url of config.urlList) {
            await checkUrl(url);
            if (url !== config.urlList.at(-1)) await sleep(config.timeoutAfterOnePage);
        }

        logMessage('Searching finished');
        if (config.useBrowser) await browser.close();
        await sleep(1000 * 60 * config.intervalMinutes);
    }
}

async function main() {
    try {
        await clearLogFile();
        logMessage('Starting...');

        await store.loadFromFile();
        await listen();
    }
    catch (error) {
        if (error instanceof Error) {
            logMessage(error.stack || `${error.name}: ${error.message}`);
        }
        else {
            logMessage(`Unexpected error: ${String(error)}`);
            throw error;
        }
    }
    finally {
        logMessage('Exit...');
        if (config.useBrowser) await browser.close();
    }
}

await main();
