let in_progress = {};

async function getUrl() {
    const tabs = await chrome.tabs.query({currentWindow: true, active: true});
    const url = new URL(tabs[0].url);
    return url.origin + url.pathname;
}

async function detailLogin(id) {
    const res = await chrome.runtime.sendMessage({
        type: "detail",
        data: {
            id
        }
    });

    if (!res.success) {
        console.error(JSON.stringify(res.error));
        return res.error.message;
    }

    return res.data;
}

async function _findLogins(url) {
    const search_res = await chrome.runtime.sendMessage({
        type: "search",
        data: {
            search: url
        }
    });

    if (!search_res.success) {
        console.error(JSON.stringify(search_res.error));
        return search_res.error;
    }

    in_progress[url] = null;

    return search_res.data;
};

function findLogins(url) {
    if (!in_progress[url]) {
        in_progress[url] = _findLogins(url);
    }

    return in_progress[url];
}

async function fillLogin(login) {
    const tabs = await chrome.tabs.query({currentWindow: true, active: true});

    chrome.tabs.sendMessage(tabs[0].id, {
        type: "fill",
        data: login
    })
}

function handleError(error, elId) {
    const el = document.getElementById(elId);

    el.style.display = "initial";
    
    switch (error) {
        case "no_url":
            el.innerText = "Passwork URL not set. Go to settings to configure.";
            break;
        case "no_api_key":
            el.innerText = "Passwork API Key not set. Go to settings to configure.";
            break;
        default:
            el.innerText = "Unknown error: " + error;
    }
}

function showLogins(container, logins) {
    const template = document.getElementById("password-entry");

    for (const login of logins.slice(0, 10)) {
        const clone = template.cloneNode(true);
        const name_span = clone.querySelector("#name");
        let name = login.name;

        if (name.length > 50) {
            name = login.name.substring(0, 20) + "..." + login.name.substring(login.name.length - 20, login.name.length);

            name_span.title = login.name;
        }
        
        name_span.innerText = name;
        clone.style.display = "flex";

        clone.querySelector("#copy_login").addEventListener("click", () => navigator.clipboard.writeText(login.login));
        clone.querySelector("#copy_password").addEventListener("click", async () => {
            let local_login = login;

            if (!local_login.password) {
                local_login = await detailLogin(local_login.id);  

                if (typeof local_login === "string") {
                    handleError(local_login, "error");
                    return;
                }
            }

            navigator.clipboard.writeText(local_login.password);
        });
        clone.querySelector("#fill").addEventListener("click", () => fillLogin(login));

        container.append(clone);
    }

    if (logins.length > 10) {
        const span = document.createElement("span");

        span.innerText = `(+${logins.length - 10} more)`;

        container.append(span);
    }

    container.style.display = "flex";
}

document.getElementById("settings").addEventListener("click", () => chrome.runtime.openOptionsPage());

(async function() {
    const search_results = document.getElementById("search-results");
    const search_loading = document.getElementById("search-loading");

    let debounce_timeout = null;
    let last_request_id = 0;

    document.querySelector("#search").addEventListener("input", e => {
        if (debounce_timeout) {
            clearTimeout(debounce_timeout);
        }

        debounce_timeout = setTimeout(async () => {
            let request_id = ++last_request_id;

            search_loading.style.display = "flex";
            search_results.style.display = "none";
            search_results.innerHTML = "";

            try {
                const logins = await findLogins(e.target.value);

                if (request_id !== last_request_id) {
                    return;
                }

                if (typeof logins === "string") {
                    throw logins;
                }

                if (logins.length === 0) {
                    search_results.innerText = "(no results)";
                } else {
                    showLogins(search_results, logins);
                }
            } catch (e) {
                if (request_id !== last_request_id) {
                    return;
                }

                if (typeof e === "string") {
                    handleError(e, "search-results");
                } else {
                    search_results.innerText = "Something went wrong. Please try again.";
                }
            } finally {
                search_loading.style.display = "none";
                search_results.style.display = "flex";
            }
        }, 500);
    })

    const url = await getUrl();

    if (!url) {
        return;
    }

    const current = document.getElementById("current");
    const loading = document.getElementById("loading");

    try {
        let logins = await findLogins(url);

        if (typeof logins === "string") {
            throw logins;
        }

        if (logins.length === 0) {
            logins = await findLogins(new URL(url).host);

            if (typeof logins === "string") {
                throw logins;
            }

            if (logins.length === 0) {
                current.innerText = "(no passwords for current url)";

                return;
            }
        }
        
        showLogins(current, logins);
    } catch (e) {
        if (typeof e === "string") {
            handleError(e, "current");
        } else {
            current.innerText = e;//"Something went wrong. Please try again.";
        }
    } finally {
        loading.style.display = "none";
        current.style.display = "flex";
    }


})();