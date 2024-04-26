import { Offer } from "./offer.js";
import { logMessage } from "./utils.js";

export class OLXOffer extends Offer {
    // static parseDate(dateStr: string) {
    //     const [day, monthText, year] = dateStr.split(' ');
    //     if (day === 'Dzisiaj') return new Date();

    //     const month: number | undefined = config.months[monthText as keyof typeof config.months];
    //     if (!Number.isInteger(month)) throw new Error(`Unknown month name: ${monthText}, ${dateStr}`);

    //     return new Date(Date.parse(`${year}-${month}-${day}`));
    // }

    static fromElement(queryUrl: URL, el: Element) {
        const title = el.getElementsByTagName("h6")[0]?.textContent || "Unknown title";

        const priceText = el.querySelector('p[data-testid="ad-price"]')?.textContent?.replace(" ", "") || "";
        let price = Number.parseFloat(priceText);
        if (Number.isNaN(price)) price = Number.parseFloat(priceText.match(/\d+ zł/)?.at(0) || "");
        if (Number.isNaN(price)) logMessage("Price is NaN!");

        const dateStr = el
            .querySelector('p[data-testid="location-date"]')
            ?.textContent?.split(" - ", 2)
            .at(1);
        if (!dateStr) logMessage("No date found!");
        // const dateAdded = dateStr ? this.parseDate(dateStr) : null;

        const pathname = el.getElementsByTagName("a")[0]?.getAttribute("href");
        if (!pathname) logMessage("Pathname is undefined!");
        const url = `https://${queryUrl.hostname}/${pathname || ""}`;

        return new OLXOffer(title, price, null, url);
    }
}
