export type StorageType = "session" | "sync" | "local";

export interface Options {
    url: string,
    key: string
}

export default class Storage {
    static get<T extends {[key: string]: any}>(type: StorageType, obj: T): Promise<T> {
        return chrome.storage[type].get(obj);
    }

    static set<T extends {[key: string]: any}>(type: StorageType, obj: T): Promise<void> {
        return chrome.storage[type].set(obj);
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