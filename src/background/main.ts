import { Message } from "@/common/messenger";
import Browser from "webextension-polyfill";
import Api from "./api";

async function onMessage(message: Message<any>, _sender: Browser.Runtime.MessageSender, sendResponse: (response: unknown) => void) {
    try {
        let res;
        switch (message.type) {
            case "search":
                res = await Api.search(message.data.search);
                break;
            case "detail":
                res = await Api.detail(message.data.id);
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

Browser.commands.onCommand.addListener(async (c, tab) => {
    if (c === "fill") {
        if (!tab) {
            throw new Error("no active tab found");
        }

        if (!tab.url) {
            throw new Error("active tab doesn't have a url");
        }

        if (!tab.id) {
            throw new Error("active tab doesn't have an id");
        }

        let url;
        try {
            url = new URL(tab.url);
        } catch (_) {
            throw new Error("failed to parse URL");
        }

        const logins = await Api.getForUrl(url);

        if (logins.length > 0) {
            const detailRes = await Api.detail(logins[0].id);

            Browser.tabs.sendMessage(tab.id, {
                type: "fill",
                data: detailRes
            })
        }
    }
});