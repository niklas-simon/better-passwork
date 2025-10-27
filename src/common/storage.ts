import Browser from "webextension-polyfill";

export type StorageType = "session" | "sync" | "local";

export interface Options {
    url: string,
    key: string
}

export default class Storage {
    static get<T extends {[key: string]: any}>(type: StorageType, obj: T): Promise<T> {
        return Browser.storage[type].get(obj) as Promise<T>;
    }

    static set<T extends {[key: string]: any}>(type: StorageType, obj: T): Promise<void> {
        return Browser.storage[type].set(obj);
    }

    static delete(type: StorageType, key: string): Promise<void> {
        return Browser.storage[type].remove(key);
    }
}

export class OptionsStorage {
    static async get(): Promise<Options> {
        let res = await Storage.get("sync", {
            url: "",
            key: ""
        });

        console.log("options", res);

        return res;
    }

    static async set(o: Options) {
        await Storage.set("sync", o);
    }
}