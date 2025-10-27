import { FullLogin, TinyLogin } from "@/common/logins";
import Storage, { OptionsStorage } from "@/common/storage";
import Browser from "webextension-polyfill";

interface Login {
    token: string,
    refreshToken: string,
    tokenExpiredAt: number,
    refreshTokenExpiredAt: number
}

interface CacheEntry<R> {
    data: R,
    stamp: number
}

interface LoginResult extends TinyLogin {
    cryptedPassword: string
}

const API_ENDPOINT = "/api/v4";

export default class Api {
    static async baseUrl() {
        const url = await Storage.get("sync", {url: null});

        if (!url.url) {
            throw new Error("Passwork URL not set. Go to settings to configure.");
        }

        return url.url + API_ENDPOINT;
    }

    static async request<R, B extends BodyInit = BodyInit>(path: string, method = "GET", body: B | null = null, auth: false | string | null = null): Promise<R> {
        console.log(method, path, body);
        const req_key = method + path + body;
        const cacheObj = await Storage.get<Record<string, CacheEntry<R> | null>>("session", {[req_key]: null});

        if (auth === null && cacheObj[req_key]) {
            const cached = cacheObj[req_key];

            if (cached.stamp > new Date().getTime() - 30_000) {
                console.log(method, path, "->", "cached");

                return cached.data;
            }

            await Storage.delete("session", req_key);
        }

        const headers = new Headers();

        if (auth === null) {
            headers.set("Passwork-Auth", await this.getToken());
        } else if (auth) {
            headers.set("Passwork-Auth", auth);
        }

        const res = await fetch((await this.baseUrl()) + path, {
            method,
            headers,
            body
        });

        console.log(method, path, "->", res.status, res.statusText);

        if (res.status !== 200) {
            let msg = "<empty body>";
            try {
                msg = await res.text();
            } catch (_ignore) {}

            throw new Error(`invalid status: ${res.status}: ${msg}`);
        }

        const res_body = await res.json();

        if (res_body.status !== "success") {
            throw new Error(`invalid status in body: ${res_body.status}`);
        }

        await Storage.set("session", {
            [req_key]: {
                stamp: new Date().getTime(),
                data: res_body.data
            }
        });

        console.log(res_body.data);

        return res_body.data as R;
    }

    static async login(): Promise<Login> {
        console.log("logging in");

        const options = await OptionsStorage.get();

        if (!options.key) {
            throw new Error("Passwork API Key not set. Go to settings to configure.")
        }

        const login_body = await this.request<Login>(`/auth/login/${options.key}`, "POST", null, options.key as string);
        
        await Storage.set("session", {
            login: login_body
        });

        console.log("login successful");

        return login_body;
    }

    static inProgress: Promise<string> | null = null;

    static async _getToken(): Promise<string> {
        try {
            let stored_login = (await Storage.get("session", {login: null})).login as Login | null;

            if (!stored_login || stored_login.refreshTokenExpiredAt <= (new Date().getTime() / 1000 + 1)) {
                console.log("refresh token expired");
                
                stored_login = await this.login();
            } else if (stored_login.tokenExpiredAt <= (new Date().getTime() / 1000 + 1)) {
                console.log("token expired");

                stored_login = await this.request<Login>(`/auth/refreshToken/${stored_login.token}/${stored_login.refreshToken}`, "POST", null, false);

                await Storage.set("session", {
                    login: stored_login
                });
            }

            this.inProgress = null;

            return stored_login.token;
        } catch (e) {
            this.inProgress = null;

            throw e;
        }
    }

    static getToken(): Promise<string> {
        if (!this.inProgress) {
            this.inProgress = this._getToken()
        }

        return this.inProgress;
    }

    static search(query: string): Promise<TinyLogin[]> {
        if (query.length < 2) {
            return Promise.resolve([]);
        }

        return this.request<TinyLogin[]>(`/passwords/search`, "POST", JSON.stringify({
            query,
            includeShared: true
        }));
    }

    static async detail(id: string): Promise<FullLogin> {
        const res = await this.request<LoginResult>(`/passwords/${id}`);

        return {...res, password: atob(res.cryptedPassword)} as FullLogin;
    }

    static async getForUrl(url?: URL) {
        if (!url) {
            const tabs = await Browser.tabs.query({currentWindow: true, active: true});

            if (!tabs || !tabs.length) {
                throw new Error("no active tab found");
            }

            if (!tabs[0].url) {
                throw new Error("active tab doesn't have a url");
            }

            try {
                url = new URL(tabs[0].url);
            } catch (_) {
                throw new Error("could not parse url of active tab");
            }
        }

        let logins = await this.search(url.origin + url.pathname);

        if (logins.length) {
            return logins;
        }

        return this.search(url.host);
    }
}