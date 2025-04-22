import type { P2PSyncSetting } from "../lib/src/common/types.ts";

export type ServerP2PSetting = P2PSyncSetting & { vaultName: string, isHeadless?: boolean };


export const envToSetting = {
    P2P_AppID: "SLS_SERVER_PEER_APPID",
    P2P_roomID: "SLS_SERVER_PEER_ROOMID",
    P2P_passphrase: "SLS_SERVER_PEER_PASSPHRASE",
    P2P_relays: "SLS_SERVER_PEER_RELAYS",
    P2P_AutoBroadcast: "SLS_SERVER_PEER_AUTOBROADCAST",
    P2P_AutoStart: "SLS_SERVER_PEER_AUTOSTART",
    P2P_AutoSyncPeers: "SLS_SERVER_PEER_AUTOSYNCPEERS",
    P2P_AutoWatchPeers: "SLS_SERVER_PEER_AUTOWATCH",
    P2P_RebuildFrom: "",
    P2P_AutoAcceptingPeers: "SLS_SERVER_PEER_AUTO_ACCEPTING_PEERS",
    P2P_AutoDenyingPeers: "SLS_SERVER_PEER_AUTO_DENYING_PEERS",
    vaultName: "SLS_SERVER_PEER_VAULT_NAME",
    isHeadless: "",
} as Record<string, string>;

declare global {
    export interface Globals {
        settings: ServerP2PSetting;
    }
}