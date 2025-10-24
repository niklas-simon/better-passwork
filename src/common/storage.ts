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
    static get(): Promise<Options> {
        return Storage.get("sync", {
            url: "",
            key: ""
        });
    }

    static set(o: Options) {
        return Storage.set("sync", o);
    }
}