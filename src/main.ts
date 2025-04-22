import { eventHub } from "../lib/src/hub/hub.ts";
import { EVENT_DENO_INFO_SUPPLIED } from "../lib/src/PlatformAPIs/deno/base.ts";

import { startServer } from "../src/ServerPeer.ts";
import { getSettings } from "../src/util.ts";
import { } from "../lib/src/PlatformAPIs/SynchromeshLoader.deno.ts";

import polyfill from "node-datachannel/polyfill";
for (const prop in polyfill) {
    //@ts-ignore Applying polyfill to globalThis
    globalThis[prop] = polyfill[prop];
}

const settings = getSettings();
const logSettings = { ...settings, P2P_passphrase: settings.P2P_passphrase.replace(/./g, "*") };
console.log("Settings:", logSettings);
const packageJson = JSON.parse(
    await Deno.readTextFile(new URL("../package.json", import.meta.url)),
);
const { version } = packageJson;
const vaultName = settings.vaultName;
eventHub.emitEvent(EVENT_DENO_INFO_SUPPLIED, {
    vaultName: vaultName,
    manifestVersion: version,
    packageVersion: version,
});

startServer(settings);
