export type MessageResult<T> = {
    success: true,
    data: T
} | {
    success: false,
    error: string
}

export default class Messenger {
    static async send<R, T>(type: string, data: T): Promise<R> {
        const res = await chrome.runtime.sendMessage({ type, data }) as MessageResult<R>;

        if (!res.success) {
            throw res.error;
        }

        return res.data;
    }

    static async sendTab<R, T>(type: string, data: T): Promise<R> {
        const tabs = await chrome.tabs.query({currentWindow: true, active: true});

        if (!tabs.length) {
            throw new Error("no active tab found");
        }

        if (!tabs[0].id) {
            throw new Error("active tab doesn't have an id");
        }

        const res = await chrome.tabs.sendMessage(tabs[0].id, { type, data }) as MessageResult<R>;

        if (!res.success) {
            throw res.error;
        }

        return res.data;
    }
}