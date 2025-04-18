import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

import config from "../config.js";
import type { Offer } from "./offer.js";

class OfferStore extends Map<string, Offer> {
    async saveToFile() {
        const str = JSON.stringify([...this], null, config.logsPretty ? "\t" : "");
        await writeFile(config.dbPath, str);
    }

    async loadFromFile() {
        if (!existsSync(config.dbPath)) return;
        const str = await readFile(config.dbPath, { encoding: "utf8" });
        if (!str) return;

        const data: Array<[string, Offer]> = JSON.parse(str);

        this.clear();
        for (const item of data) this.set(...item);
    }
}

export const store = new OfferStore();
