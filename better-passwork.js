function getUrl() {
    return window.location.href.slice(0, window.location.href.length - window.location.hash.length)
}

let in_progress = null;

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

async function _findLogins() {
    const search_res = await browser.runtime.sendMessage({
        type: "search",
        data: {
            search: getUrl()
        }
    });

    if (!search_res.success) {
        console.error(search_res.error);
        return null;
    }

    in_progress = null;

    return search_res.data;
};

function findLogins() {
    if (!in_progress) {
        in_progress = _findLogins();
    }

    return in_progress;
}

async function fillLogin(data = null) {
    if (!data && !logins) {
        logins = await findLogins();

        if (!logins) {
            return;
        }
    }

    let login = data || logins[0];

    if (!login.password) {
        login = await detailLogin(login.id);
    }

    userInput.value = login.login;
    userInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
    passwordInput.value = login.password;
    passwordInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
}

let logins = null,
    passwordInput = null,
    userInput = null;

// Select the node that will be observed for mutations
const targetNode = document.body;

// Options for the observer (which mutations to observe)
const config = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
    // find first password field
    passwordInput = targetNode.querySelector("input[type='password']");

    if (!passwordInput) {
        return;
    }

    // is it already processed?
    if (passwordInput.getAttribute("data-better-passwork-processed") === "true") {
        return;
    }

    // find nearest form in parents
    const form = passwordInput.closest("form");

    if (!form) {
        return;
    }

    // find corresponding user input
    userInput = document.querySelectorAll("input[type='text'],input:not([type])")[0];

    if (!userInput) {
        return;
    }

    // set to processed
    passwordInput.setAttribute("data-better-passwork-processed", "true");
    userInput.style.border = "1px solid lime";
    passwordInput.style.border = "1px solid lime";

    if (!logins) {
        findLogins();
    }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

async function onMessage(message, sender, sendResponse) {
    try {
        let res = undefined;
        switch (message.type) {
            case "fill":
                await fillLogin(message.data);
                break;
        }

        sendResponse({
            success: true,
            data: res
        });
    } catch (e) {
        sendResponse({
            success: false,
            error: e
        })
    }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!["fill"].includes(message.type)) {
        return false;
    }

    onMessage(message, sender, sendResponse);

    return true;
});