document.getElementById("options-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    await chrome.storage.sync.set({
        url: document.getElementById("url").value,
        key: document.getElementById("key").value
    });
});

(async function() {
    const url = await chrome.storage.sync.get("url");
    const key = await chrome.storage.sync.get("key");

    document.getElementById("url").value = url?.url || "";
    document.getElementById("key").value = key?.key || "";
})();