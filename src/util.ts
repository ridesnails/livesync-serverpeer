import { P2P_DEFAULT_SETTINGS } from "../lib/src/common/types.ts";
import { envToSetting, type ServerP2PSetting } from "./types.ts";


function getEnv(key: string): string | undefined {
    if (Deno) {
        return Deno.env.get(key);
    }
    // deno-lint-ignore no-process-global
    if (typeof process !== "undefined") {
        // deno-lint-ignore no-process-global
        return process.env[key];
    }
    return undefined;
}
export function getSettings(): ServerP2PSetting {
    const result = {
        ...P2P_DEFAULT_SETTINGS,
        vaultName: "server-pseudo-peer-vault",
        P2P_IsHeadless: true,
    } as ServerP2PSetting;
    for (const key of Object.keys(result) as (keyof ServerP2PSetting)[]) {
        const envKey = envToSetting[key];
        if (!envKey) {
            continue;
        }
        const envValue = getEnv(envKey);
        if (envValue) {
            if (typeof result[key] === "boolean") {
                // @ts-ignore as boolean
                result[key] = envValue == "true";
            } else if (typeof result[key] === "number") {
                // @ts-ignore as number
                result[key] = parseFloat(envValue);
            } else {
                // @ts-ignore as string
                result[key] = envValue;
            }
        }
    }
    return result;
}
