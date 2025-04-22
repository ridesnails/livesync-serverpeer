import { } from "../lib/src/PlatformAPIs/SynchromeshLoader.deno.ts";
import { Synchromesh } from "../lib/src/PlatformAPIs/Synchromesh.ts";
import { LOG_LEVEL_VERBOSE } from "../lib/src/common/types.ts";
import { defaultLoggerEnv, setGlobalLogFunction } from "../lib/src/common/logger.ts";
import type { CommandShim, PluginShim } from "../lib/src/replication/trystero/P2PReplicatorPaneCommon.ts";

setGlobalLogFunction((msg, _level) => {
    const msgstr = typeof msg === "string" ? msg : JSON.stringify(msg);
    const strLog = `${new Date().toISOString()}\t${msgstr}`;
    console.log(strLog);
    if (msg instanceof Error) {
        console.error(msg);
    }
});
defaultLoggerEnv.minLogLevel = LOG_LEVEL_VERBOSE;

export type BindingApp = {
    cmdSync: CommandShim;
    plugin: PluginShim;
};


// export const storeP2PStatusLine = writable("");

export async function getWrappedSynchromesh(): ReturnType<typeof Synchromesh> {
    const synchronised = await Synchromesh();
    return synchronised;
}
