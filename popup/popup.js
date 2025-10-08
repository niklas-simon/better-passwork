let in_progress = null;

async function getUrl() {
    const tabs = await browser.tabs.query({currentWindow: true, active: true});
    const url = new URL(tabs[0].url);
    return url.origin + url.pathname;
}

async function detailLogin(id) {
    const res = await browser.runtime.sendMessage({
        type: "detail",
        data: {
            id
        }
    });

    if (!res.success) {
        console.error(res.error);
        return null;
    }

    return res.data;
}

async function _findLogins(url) {
    const search_res = await browser.runtime.sendMessage({
        type: "search",
        data: {
            search: url
        }
    });

    if (!search_res.success) {
        console.error(search_res.error);
        return null;
    }

    in_progress = null;

    return search_res.data;
};

function findLogins(url) {
    if (!in_progress) {
        in_progress = _findLogins(url);
    }

    return in_progress;
}

async function fillLogin(login) {
    const tabs = await browser.tabs.query({currentWindow: true, active: true});

    browser.tabs.sendMessage(tabs[0].id, {
        type: "fill",
        data: login
    })
}

function showLogins(container, logins) {
    const template = document.getElementById("password-entry");

    for (const login of logins) {
        const clone = template.cloneNode(true);
        
        clone.querySelector("#name").innerText = login.name;
        clone.style.display = "flex";

        clone.querySelector("#copy_login").addEventListener("click", () => navigator.clipboard.writeText(login.login));
        clone.querySelector("#copy_password").addEventListener("click", async () => {
            let local_login = login;

            if (!local_login.password) {
                local_login = await detailLogin(local_login.id);  
            }

            navigator.clipboard.writeText(local_login.password);
        });
        clone.querySelector("#fill").addEventListener("click", () => fillLogin(login));

        container.append(clone);
    }

    container.style.display = "flex";
}

document.getElementById("settings").addEventListener("click", () => browser.runtime.openOptionsPage());

(async function() {
    console.log("hello popup");

    let debounce_timeout = null;

    document.querySelector("#search").addEventListener("input", e => {
        console.log(e.target.value);

        if (debounce_timeout) {
            clearTimeout(debounce_timeout);
        }

        debounce_timeout = setTimeout(async () => {
            const search_results = document.getElementById("search-results");

            document.getElementById("search-loading").style.display = "initial";
            search_results.style.display = "none";
            search_results.innerHTML = "";

            const logins = await findLogins(e.target.value);

            document.getElementById("search-loading").style.display = "none";

            if (logins.length === 0) {
                search_results.innerText = "(no results)";
            } else {
                showLogins(search_results, logins);
            }
        }, 500);
    })

    const url = await getUrl();

    if (!url) {
        return;
    }

    let logins = await findLogins(url);

    if (logins.length === 0) {
        logins = await findLogins(new URL(url).host);

        if (logins.length === 0) {
            document.getElementById("loading").innerText = "(no passwords for current url)"
            return;
        }
    }

    document.getElementById("loading").style.display = "none";

    const current = document.getElementById("current");

    showLogins(current, logins);
})();