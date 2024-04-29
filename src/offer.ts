import { sendNotification } from "./notification";
import { store } from "./store";
import { logMessage } from "./utils";

export interface Offer {
    title: string;
    price: number;
    dateAdded: Date | null;
    url: string;
}

function isOfferNew(offerId: string, offer: Offer) {
    const offerFromStore = store.get(offerId);
    return !offerFromStore || offerFromStore.price !== offer.price;
}

export async function handleParsedOffer(offer: Offer, offerId: string) {
    if (!isOfferNew(offerId, offer)) return;

    // biome-ignore format: more readable
    logMessage(
        `\n| Title:  ${offer.title}` +
        `\n| Price:  ${offer.price} zł` +
        `\n| URL:    ${offer.url}` +
        "\n-------------"
    );
    sendNotification(offer);

    store.set(offerId, offer);
    await store.saveToFile();
}
