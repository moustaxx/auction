export interface OfferProps {
    title: string;
    price: number;
    dateAdded: Date | null;
    url: string;
}

export abstract class Offer implements OfferProps {
    title: string;
    price: number;
    dateAdded: Date | null;
    url: string;

    static fromElement(queryUrl: URL, el: Element): Offer {
        throw new Error('Using Offer.fromElement method directly!');
    }

    toString() {
        return JSON.stringify(this);
    }

    constructor(title: string, price: number, dateAdded: Date | null, url: string) {
        this.title = title;
        this.price = price;
        this.dateAdded = dateAdded;
        this.url = url;
    }
}
