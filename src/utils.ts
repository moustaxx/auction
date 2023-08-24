import { writeFile } from 'node:fs/promises';
import { appendFileSync } from 'node:fs';

import config from '../config.js';

export const sleep = async (delay: number) => new Promise(resolve => setTimeout(resolve, delay));

export function logMessage(message: string) {
    if (!config.logsEnabled) return;

    const timestamp = new Date().toISOString();
    const msg = `${timestamp}: ${message}`;

    console.log('>', msg);
    appendFileSync(config.logsPath, msg + '\n');
}

export function logError(error: any) {
    if (error instanceof Error) {
        if (error.stack) logMessage(error.stack);
        else logMessage(`${error.name}: ${error.message}`);
    }
}

export async function clearLogFile() {
    await writeFile(config.logsPath, '');
}
