import Logins, { FullLogin, TinyLogin } from "@/common/logins";
import { Message } from "@/common/messenger";
import Browser from "webextension-polyfill";

let in_progress: Promise<TinyLogin[]> | null = null;
let logins: TinyLogin[] | null = null;
let passwordInput: HTMLInputElement | null = null;
let userInput: HTMLInputElement | null = null;

async function findLogins() {
    if (!in_progress) {
        let url;
        try {
            url = new URL(window.location.href);
        } catch (e) {
            throw new Error("failed to parse URL");
        }

        in_progress = Logins.currentUrl(url);
    }

    logins = await in_progress;

    return logins;
}

async function fillLogin(data: FullLogin | null = null) {
    if (!userInput || !passwordInput) {
        return;
    }
    
    if (!data && !logins) {
        await findLogins();

        if (!logins) {
            return;
        }
    }

    let login = data || logins![0];

    if (!login) {
        return;
    }

    let fullLogin = await Logins.detail(login.id);

    userInput.value = fullLogin.login;
    userInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
    passwordInput.value = fullLogin.password;
    passwordInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
}

function addFillerToInput(input: HTMLInputElement) {
    const img = document.createElement("img");
    
    img.src = Browser.runtime.getURL("public/logo.png");
    img.style.height = "1em";
    img.style.position = "absolute";
    img.style.zIndex = "1000";
    img.style.filter = logins && logins.length ? "" : "grayscale(1)";
    img.style.cursor = logins && logins.length ? "" : "not-allowed";
    img.className = "better-passwork-filler";
    
    document.body.append(img);

    img.addEventListener("click", () => fillLogin());

    if (!input.id) {
        input.id = btoa(new Uint8Array(Array.from(new Array(32)).map(() => Math.random() * 256)).join(""));
    }

    img.dataset.forInput = input.id;

    updateFillerPosition(img);
}

function updateFillerPosition(filler: HTMLImageElement) {
    if (!filler.dataset.forInput) {
        return;
    }

    const input = document.getElementById(filler.dataset.forInput);

    if (!input) {
        return;
    }

    const inputRect = input.getBoundingClientRect();
    const imgRect = filler.getBoundingClientRect();

    filler.style.top = (inputRect.top + inputRect.height / 2 - imgRect.height / 2) + "px";
    filler.style.left = (inputRect.left + inputRect.width - inputRect.height / 2 - imgRect.height / 2) + "px";
}

function updateAllFillerPositions() {
    document.querySelectorAll(".better-passwork-filler").forEach(e => {
        const forInput = (e as HTMLImageElement).dataset.forInput;

        if (!forInput) {
            return;
        }

        const input = document.getElementById(forInput);

        if (!input || !input.isConnected) {
            document.body.removeChild(e);
        } else {
            updateFillerPosition(e as HTMLImageElement);
        }
    })
}

function activateFillers() {
    document.querySelectorAll(".better-passwork-filler").forEach(e => {
        (e as HTMLImageElement).style.filter = "";
        (e as HTMLImageElement).style.cursor = "";
    });
}

// Select the node that will be observed for mutations
const targetNode = document.body;

// Options for the observer (which mutations to observe)
const config = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback: MutationCallback = async (_mutationList, _observer) => {
    updateAllFillerPositions();

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
    userInput = (document.querySelectorAll("input[type='text'],input:not([type])")[0] ?? null) as HTMLInputElement | null;

    if (!userInput) {
        return;
    }

    // set to processed
    passwordInput.setAttribute("data-better-passwork-processed", "true");

    addFillerToInput(userInput);
    addFillerToInput(passwordInput);

    if (!logins) {
        await findLogins();
    }

    if (logins && logins.length) {
        activateFillers();
    }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

window.addEventListener("resize", () => updateAllFillerPositions());

async function onMessage(message: Message<any>, _sender: Browser.Runtime.MessageSender, sendResponse: (response: unknown) => void) {
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

Browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const _message = message as Message<any>;
    if (!["fill"].includes(_message.type)) {
        sendResponse(undefined);
        return true;
    }

    onMessage(_message, sender, sendResponse);

    return true;
});