import { FullLogin, TinyLogin } from "@/common/logins";
import { Message } from "@/common/messenger";
import Storage, { OptionsStorage } from "@/common/storage";
import Browser from "webextension-polyfill";

console.log("Hello World!");

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

async function baseUrl() {
    const url = await Storage.get("sync", {url: null});

    if (!url.url) {
        throw new Error("no_url");
    }

    return url.url + API_ENDPOINT;
}

async function request<R, B extends BodyInit = BodyInit>(path: string, method = "GET", body: B | null = null, auth: false | string | null = null): Promise<R> {
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
        headers.set("Passwork-Auth", await getToken());
    } else if (auth) {
        headers.set("Passwork-Auth", auth);
    }

    const res = await fetch((await baseUrl()) + path, {
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

async function login(): Promise<Login> {
    console.log("logging in");

    const options = await OptionsStorage.get();

    if (!options.key) {
        throw new Error("no_api_key")
    }

    const login_body = await request<Login>(`/auth/login/${options.key}`, "POST", null, options.key as string);
    
    await Storage.set("session", {
        login: login_body
    });

    console.log("login successful");

    return login_body;
}

let inProgress: Promise<string> | null = null;

async function _getToken(): Promise<string> {
    let stored_login = (await Storage.get("session", {login: null})).login as Login | null;

    if (!stored_login || stored_login.refreshTokenExpiredAt <= (new Date().getTime() / 1000 + 1)) {
        console.log("refresh token expired");
        
        stored_login = await login();
    } else if (stored_login.tokenExpiredAt <= (new Date().getTime() / 1000 + 1)) {
        console.log("token expired");

        stored_login = await request<Login>(`/auth/refreshToken/${stored_login.token}/${stored_login.refreshToken}`, "POST", null, false);

        await Storage.set("session", {
            login: stored_login
        });
    }

    inProgress = null;

    return stored_login.token;
}

function getToken(): Promise<string> {
    if (!inProgress) {
        inProgress = _getToken()
    }

    return inProgress;
}

function search(query: string): Promise<TinyLogin[]> {
    return request<TinyLogin[]>(`/passwords/search`, "POST", JSON.stringify({
        query,
        includeShared: true
    }));
}

async function detail(id: string): Promise<FullLogin> {
    const res = await request<LoginResult>(`/passwords/${id}`);

    return {...res, password: atob(res.cryptedPassword)} as FullLogin;
}

async function onMessage(message: Message<any>, _sender: Browser.Runtime.MessageSender, sendResponse: (response: unknown) => void) {
    try {
        let res;
        switch (message.type) {
            case "search":
                res = await search(message.data.search);
                break;
            case "detail":
                res = await detail(message.data.id);
                break;
            case "log":
                console.log(message.data);
                break;
        }

        sendResponse({
            success: true,
            data: res
        });
    } catch (e) {
        console.error(e);
        sendResponse({
            success: false,
            error: typeof e === "object" && (e as Error).message ? (e as Error).message : ("" + e)
        })
    }
}

Browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const _message = message as Message<any>;
    if (!["search", "detail", "log"].includes(_message.type)) {
        sendResponse(undefined);
        return true;
    }

    onMessage(_message, sender, sendResponse);

    return true;
});

Browser.commands.onCommand.addListener(async c => {
    if (c === "fill") {
        const tabs = await Browser.tabs.query({currentWindow: true, active: true});

        if (!tabs || !tabs.length) {
            throw new Error("no active tab found");
        }

        if (!tabs[0].url) {
            throw new Error("active tab doesn't have a url");
        }

        if (!tabs[0].id) {
            throw new Error("active tab doesn't have an id");
        }

        const fullUrl = new URL(tabs[0].url);
        const url = fullUrl.origin + fullUrl.pathname;

        let searchRes = await search(url);

        if (!searchRes.length) {
            searchRes = await search(fullUrl.origin);
        }

        if (searchRes.length > 0) {
            const detailRes = await detail(searchRes[0].id);

            Browser.tabs.sendMessage(tabs[0].id, {
                type: "fill",
                data: detailRes
            })
        }
    }
});