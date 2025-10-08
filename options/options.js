console.log("hello options");

document.getElementById("options-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    await browser.storage.sync.set({
        url: document.getElementById("url").value,
        key: document.getElementById("key").value
    });
});

(async function() {
    const url = await browser.storage.sync.get("url");
    const key = await browser.storage.sync.get("key");

    document.getElementById("url").value = url?.url || "";
    document.getElementById("key").value = key?.key || "";
})();