import { EVENT_LAYOUT_READY } from "../lib/src/events/coreEvents.ts";
import { eventHub } from "../lib/src/hub/hub.ts";
import { Synchromesh } from "../lib/src/PlatformAPIs/Synchromesh.ts";
import { cmdSyncShim } from "./P2PReplicatorShim.ts";
import type { ServerP2PSetting } from "./types.ts";

export async function startServer(conf: ServerP2PSetting) {
    const { globalVariables } = await Synchromesh();
    globalVariables.set("settings", conf);
    conf.P2P_Enabled = true;
    conf.P2P_AutoStart = true;
    conf.P2P_AutoBroadcast = true;

    const synchronised = cmdSyncShim.init();

    synchronised.then(() => {
        console.log("Ready to synchronise");
        eventHub.emitEvent(EVENT_LAYOUT_READY);
    });
}