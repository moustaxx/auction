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
        return '' +
            '\n| Title:  ' + this.title +
            '\n| Price:  ' + this.price + ' zł' +
            '\n| URL:    ' + this.url +
            '\n-------------';
    }

    constructor(title: string, price: number, dateAdded: Date | null, url: string) {
        this.title = title;
        this.price = price;
        this.dateAdded = dateAdded;
        this.url = url;
    }
}
