import { appendFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";

import config from "../config.js";

export const sleep = async (delay: number) => new Promise(resolve => setTimeout(resolve, delay));

function addMinusesAndZeros(...args: number[]) {
    let str = "";
    for (let i = 0; i < args.length; i++) {
        str += args[i] < 10 ? "0" + args[i].toString() : args[i].toString();
        if (i !== args.length - 1) str += "-";
    }
    return str;
}

export function getFileNameTimestamp() {
    const date = new Date();
    return addMinusesAndZeros(
        date.getDate(),
        date.getMonth() + 1,
        date.getFullYear(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    );
}

const logFileTimestamp = getFileNameTimestamp();

export function logMessage(message: string) {
    if (!config.logsEnabled) return;

    const timestamp = new Date().toLocaleString("sv");
    const msg = `${timestamp}: ${message}`;

    console.log(">", msg);

    if (!existsSync(config.logsDirectory)) {
        mkdirSync(config.logsDirectory);
    }

    appendFileSync(`${config.logsDirectory}/log-${logFileTimestamp}.txt`, msg + "\n");
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function logError(error: any) {
    if (error instanceof Error) {
        if (error.stack) logMessage(error.stack);
        else logMessage(`${error.name}: ${error.message}`);
    }
}

export function cleanUpLogsAndScreenshots() {
    const { logsToKeep, logsDirectory } = config;

    if (!existsSync(logsDirectory)) return;

    const fileList = readdirSync(logsDirectory)
        .map(name => ({ name, mtimeMs: statSync(`${logsDirectory}/${name}`).mtimeMs }))
        .sort((file1, file2) => file2.mtimeMs - file1.mtimeMs);

    const logFiles = fileList.filter(file => file.name.startsWith("log"));

    for (let i = logsToKeep - 1; i < logFiles.length; i++) {
        rmSync(`${logsDirectory}/${logFiles[i].name}`);
    }

    const screenshotFiles = fileList.filter(file => file.name.startsWith("error-ss"));

    for (let i = logsToKeep; i < screenshotFiles.length; i++) {
        rmSync(`${logsDirectory}/${screenshotFiles[i].name}`);
    }
}
