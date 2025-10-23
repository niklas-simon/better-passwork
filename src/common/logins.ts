import Messenger from "./messenger";

export interface TinyLogin {
    id: string,
    name: string,
    login: string,
    url: string
}

export interface FullLogin extends TinyLogin {
    password: string
}

export default class Logins {
    static async search(search: string) {
        const res: TinyLogin[] = await Messenger.send("search", { search });

        return res;
    }

    static async currentUrl(): Promise<TinyLogin[]> {
        const tabs = await chrome.tabs.query({currentWindow: true, active: true});

        if (!tabs.length) {
            throw new Error("no active tab found");
        }

        if (!tabs[0].url) {
            throw new Error("active tab doesn't have a url");
        }

        let url: URL;
        try {
            url = new URL(tabs[0].url);
        } catch (_) {
            throw new Error("could not parse url of active tab");
        }

        let logins = await this.search(url.origin + url.pathname);

        if (logins.length) {
            return logins;
        }

        return this.search(url.host);
    }

    static async detail(id: string) {
        const res: FullLogin = await Messenger.send("detail", { id });

        return res;
    }

    static async fill(login: TinyLogin) {
        await Messenger.sendTab("fill", login);
    }
}