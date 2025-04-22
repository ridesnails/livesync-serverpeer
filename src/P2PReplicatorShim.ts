import { } from "../lib/src/PlatformAPIs/SynchromeshLoader.deno.ts";
// import _PouchDB from "pouchdb-core";
import { PouchDB } from "../lib/src/pouchdb/pouchdb-browser.ts";
import adapter from "pouchdb-adapter-leveldb";
PouchDB.plugin(adapter);

const MyPouch = PouchDB.defaults({
    adapter: "leveldb",
    prefix: "./dat/",
});
import {
    type EntryDoc,
    type LOG_LEVEL,
    type ObsidianLiveSyncSettings,
    type P2PSyncSetting,
    LOG_LEVEL_NOTICE,
    LOG_LEVEL_VERBOSE,
    P2P_DEFAULT_SETTINGS,
    REMOTE_P2P,
} from "../lib/src/common/types.ts";
import { eventHub } from "../lib/src/hub/hub.ts";

import type { Confirm } from "../lib/src/interfaces/Confirm.ts";
import type { IEnvironment, ISimpleStoreAPI } from "../lib/src/PlatformAPIs/interfaces.ts";
import { Logger } from "../lib/src/common/logger.ts";
import { getWrappedSynchromesh } from "./CommandsShim.ts";
import {
    type CommandShim,
    type PeerStatus,
    type PluginShim,
} from "../lib/src/replication/trystero/P2PReplicatorPaneCommon.ts";
import { P2PReplicatorMixIn, type P2PReplicatorBase } from "../lib/src/replication/trystero/P2PReplicatorCore.ts";
import type { SimpleStore } from "octagonal-wheels/databases/SimpleStoreBase";
import { reactiveSource } from "octagonal-wheels/dataobject/reactive_v2";
import { EVENT_SETTING_SAVED } from "../lib/src/events/coreEvents.ts";
import { unique } from "octagonal-wheels/collection";
// import { Menu } from "./lib/src/PlatformAPIs/browser/Menu.ts";


type StoreDataType = ObsidianLiveSyncSettings;

export class P2PReplicatorShimBase implements P2PReplicatorBase {
    storeP2PStatusLine = reactiveSource("");
    plugin!: PluginShim;
    environment!: IEnvironment;
    confirm!: Confirm;
    simpleStoreAPI!: ISimpleStoreAPI;
    db?: PouchDB.Database<EntryDoc>;

    getDB() {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        return this.db;
    }
    _simpleStore!: SimpleStore<StoreDataType>;
    async closeDB() {
        if (this.db) {
            await this.db.close();
            this.db = undefined;
        }
    }
    getDeviceName() {
        return this.plugin.$$getVaultName();
    }

    async init() {
        const { confirm, environment, simpleStoreAPI, globalVariables } = await getWrappedSynchromesh();
        this.confirm = confirm;
        this.environment = environment;
        this.simpleStoreAPI = simpleStoreAPI;
        if (this.db) {
            try {
                await this.closeDB();

            } catch (ex) {
                Logger("Error closing db", LOG_LEVEL_VERBOSE);
                Logger(ex, LOG_LEVEL_VERBOSE);
            }
        }
        const conf = globalVariables.get("settings");

        const repStore = this.simpleStoreAPI.getSimpleStore<StoreDataType>("p2p-livesync-server-peer");
        this._simpleStore = repStore;
        let _settings = (conf as ObsidianLiveSyncSettings | undefined) || (await repStore.get("settings")) || ({ ...P2P_DEFAULT_SETTINGS } as ObsidianLiveSyncSettings);
        this.plugin = {
            saveSettings: async () => {
                await repStore.set("settings", _settings);
                eventHub.emitEvent(EVENT_SETTING_SAVED, _settings);
            },
            get settings() {
                return _settings;
            },
            set settings(newSettings: P2PSyncSetting) {
                _settings = { ..._settings, ...newSettings };
            },
            rebuilder: null,
            $$scheduleAppReload: () => { },
            $$getVaultName: () => globalVariables.get("settings")?.vaultName ?? "server-pseudo-peer-vault",
        };
        const deviceName = this.getDeviceName();
        const database_name = this.settings.P2P_AppID + "-" + this.settings.P2P_roomID + deviceName;
        try {
            console.log("Initialising DB " + database_name)
            this.db = new MyPouch<EntryDoc>(database_name);
            console.log("Initialised")
        } catch (ex) {
            console.error(ex);
            throw ex;
        }
        return this;
    }
    get settings() {
        return this.plugin.settings;
    }
    _log(msg: string, level?: LOG_LEVEL): void {
        Logger(msg, level);
    }
    _notice(msg: string, key?: string): void {
        Logger(msg, LOG_LEVEL_NOTICE, key);
    }
    getSettings(): P2PSyncSetting {
        return this.settings;
    }
    simpleStore(): SimpleStore<StoreDataType> {
        return this._simpleStore;
    }
    handleReplicatedDocuments(_docs: EntryDoc[]): Promise<void> {
        // No op. This is a client and does not need to process the docs
        return Promise.resolve();
    }
}

function addToList(item: string, list: string) {
    return unique(
        list
            .split(",")
            .map((e) => e.trim())
            .concat(item)
            .filter((p) => p)
    ).join(",");
}
function removeFromList(item: string, list: string) {
    return list
        .split(",")
        .map((e) => e.trim())
        .filter((p) => p !== item)
        .filter((p) => p)
        .join(",");
}

export class P2PReplicatorShim extends P2PReplicatorMixIn(P2PReplicatorShimBase) implements CommandShim {
    _originalSettings?: P2PSyncSetting;
    setSettings(settings: P2PSyncSetting) {
        this._originalSettings = settings;
    }
    override getDeviceName(): string {
        return this.getConfig("p2p_device_name") ?? this.plugin.$$getVaultName();
    }
    override getPlatform(): string {
        return "pseudo-replicator";
    }
    override afterConstructor(): void {
        // eventHub.onEvent(EVENT_P2P_PEER_SHOW_EXTRA_MENU, ({ peer, event }) => {
        // });
        // this.p2pLogCollector.p2pReplicationLine.onChanged((line) => {
        //     // storeP2PStatusLine.set(line.value);
        // });
    }
    override async init() {
        const r = await super.init();
        setTimeout(() => {
            if (this.settings.P2P_AutoStart && this.settings.P2P_Enabled) {
                void this.open();
            }
        }, 1000);
        return r;
    }

    get replicator() {
        return this._replicatorInstance!;
    }
    async replicateFrom(peer: PeerStatus) {
        await this.replicator.replicateFrom(peer.peerId);
    }
    async replicateTo(peer: PeerStatus) {
        await this.replicator.requestSynchroniseToPeer(peer.peerId);
    }
    async getRemoteConfig(peer: PeerStatus) {
        Logger(
            `Requesting remote config for ${peer.name}. Please input the passphrase on the remote device`,
            LOG_LEVEL_NOTICE
        );
        const remoteConfig = await this.replicator.getRemoteConfig(peer.peerId);
        if (remoteConfig) {
            Logger(`Remote config for ${peer.name} is retrieved successfully`);
            const DROP = "Yes, and drop local database";
            const KEEP = "Yes, but keep local database";
            const CANCEL = "No, cancel";
            const yn = await this.confirm.askSelectStringDialogue(
                `Do you really want to apply the remote config? This will overwrite your current config immediately and restart.
    And you can also drop the local database to rebuild from the remote device.`,
                [DROP, KEEP, CANCEL] as const,
                {
                    defaultAction: CANCEL,
                    title: "Apply Remote Config ",
                }
            );
            if (yn === DROP || yn === KEEP) {
                if (yn === DROP) {
                    if (remoteConfig.remoteType !== REMOTE_P2P) {
                        const yn2 = await this.confirm.askYesNoDialog(
                            `Do you want to set the remote type to "P2P Sync" to rebuild by "P2P replication"?`,
                            {
                                title: "Rebuild from remote device",
                            }
                        );
                        if (yn2 === "yes") {
                            remoteConfig.remoteType = REMOTE_P2P;
                            remoteConfig.P2P_RebuildFrom = peer.name;
                        }
                    }
                }
                this.plugin.settings = remoteConfig;
                await this.plugin.saveSettings();
                if (yn === DROP) {
                    await this.plugin.rebuilder.scheduleFetch();
                } else {
                    await this.plugin.$$scheduleAppReload();
                }
            } else {
                Logger(`Cancelled\nRemote config for ${peer.name} is not applied`, LOG_LEVEL_NOTICE);
            }
        } else {
            Logger(`Cannot retrieve remote config for ${peer.peerId}`);
        }
    }

    async toggleProp(peer: PeerStatus, prop: "syncOnConnect" | "watchOnConnect" | "syncOnReplicationCommand") {
        const settingMap = {
            syncOnConnect: "P2P_AutoSyncPeers",
            watchOnConnect: "P2P_AutoWatchPeers",
            syncOnReplicationCommand: "P2P_SyncOnReplication",
        } as const;

        const targetSetting = settingMap[prop];
        if (peer[prop]) {
            this.plugin.settings[targetSetting] = removeFromList(peer.name, this.plugin.settings[targetSetting]);
            await this.plugin.saveSettings();
        } else {
            this.plugin.settings[targetSetting] = addToList(peer.name, this.plugin.settings[targetSetting]);
            await this.plugin.saveSettings();
        }
    }
}

export const cmdSyncShim = new P2PReplicatorShim();
