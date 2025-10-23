const API_ENDPOINT = "/api/v4";

async function baseUrl() {
    const url = await chrome.storage.sync.get("url");

    if (!url.url) {
        throw new Error("no_url");
    }

    return url.url + API_ENDPOINT;
}

const cache = new Map();

async function request(path, method = "GET", body = null, auth = null) {
    console.log(method, path, body);
    const req_key = method + path + body;

    if (auth === null && cache.has(req_key)) {
        const cached = cache.get(req_key);

        if (cached.stamp > new Date().getTime() - 30_000) {
            console.log(method, path, "->", "cached");

            return cached.data;
        }

        cache.delete(req_key);
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

    cache.set(req_key, {
        stamp: new Date().getTime(),
        data: res_body.data
    });

    console.log(res_body.data);

    return res_body.data;
}

async function login() {
    console.log("logging in");

    const key = await chrome.storage.sync.get("key");

    if (!key.key) {
        throw new Error("no_api_key")
    }

    const login_body = await request(`/auth/login/${key.key}`, "POST", null, key.key);
    
    await chrome.storage.session.set({
        login: login_body
    });

    console.log("login successful");

    return login_body;
}

let inProgress = null;

async function _getToken() {
    let stored_login = (await chrome.storage.session.get("login")).login;

    if (!stored_login || stored_login.refreshTokenExpiredAt <= (new Date().getTime() / 1000 + 1)) {
        console.log("refresh token expired");
        
        stored_login = await login();
    } else if (stored_login.tokenExpiredAt <= (new Date().getTime() / 1000 + 1)) {
        console.log("token expired");

        stored_login = await request(`/auth/refreshToken/${stored_login.token}/${stored_login.refreshToken}`, "POST", null, false);

        await chrome.storage.session.set({
            login: stored_login
        });
    }

    inProgress = null;

    return stored_login.token;
}

function getToken() {
    if (!inProgress) {
        inProgress = _getToken()
    }

    return inProgress;
}

function search(query) {
    return request(`/passwords/search`, "POST", JSON.stringify({
        query,
        includeShared: true
    }));
}

async function detail(id) {
    const res = await request(`/passwords/${id}`);

    return {...res, password: atob(res.cryptedPassword)};
}

async function onMessage(message, sender, sendResponse) {
    try {
        let res;
        switch (message.type) {
            case "search":
                res = await search(message.data.search);
                break;
            case "detail":
                res = await detail(message.data.id);
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
            error: typeof e === "object" && e.message ? e.message : ("" + e)
        })
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!["search", "detail"].includes(message.type)) {
        return false;
    }

    onMessage(message, sender, sendResponse);

    return true;
});

chrome.commands.onCommand.addListener(async c => {
    if (c === "fill") {
        const tabs = await chrome.tabs.query({currentWindow: true, active: true});

        const fullUrl = new URL(tabs[0].url);
        const url = fullUrl.origin + fullUrl.pathname;

        let searchRes = await search(url);

        if (!searchRes.length) {
            searchRes = await search(fullUrl.origin);
        }

        if (searchRes.length > 0) {
            const detailRes = await detail(searchRes[0].id);

            chrome.tabs.sendMessage(tabs[0].id, {
                type: "fill",
                data: detailRes
            })
        }
    }
});

(async function() {

})();