import { Offer } from './offer.js';
import { logMessage } from './utils.js';

export class AllegroOffer extends Offer {
    static fromElement(queryUrl: URL, el: Element) {
        const title = el.getElementsByTagName('h2')[0]?.textContent || 'Unknown title';

        const priceText = el.querySelector('span[data-test-tag="price-container"]')?.textContent || '';
        const price = Number.parseFloat(priceText);
        if (Number.isNaN(price)) logMessage('Price is NaN!');

        const url = el.getElementsByTagName('h2')[0]?.firstElementChild?.getAttribute('href') || '';
        if (!url) logMessage('URL is undefined!');

        // newOffer.isAuction = !!el.textContent?.includes('LICYTACJA');

        return new AllegroOffer(title, price, null, url);
    }
}

