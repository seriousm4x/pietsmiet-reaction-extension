const logTag = " --> [PSRE] [background]";
const api = getBrowser();

let settings = {
    showNoReactions: true,
    foundReactionsBgColor: "#9b393c",
    noReactionsBgColor: "#046931",
};

function handleInstall(callback) {
    // set reactions
    fetch("https://raw.githubusercontent.com/seriousm4x/pietsmiet-reaction-extension/main/data/matches.min.json")
        .then(res => res.json())
        .then(data => {
            api.storage.local.set({
                reactions: {
                    fetched_at: Date.now(),
                    videos: data,
                }
            });
        })

    // set default settings
    api.storage.local.set(settings)
}

function handleMessage(request, sender, sendResponse) {
    if (request.message === "saveSettings") {
        api.storage.local.set(request.settings, result => {
            sendResponse(result);
        });
        console.log(logTag, "saved settings");
    } else if (request.message === "getSettings") {
        api.storage.local.get(settings, result => {
            sendResponse(result);
        });
    } else if (request.message === "getReactions") {
        api.storage.local.get("reactions", result => {
            sendResponse(result);
        });
    }
    return true;
}

function getBrowser() {
    if (typeof chrome !== "undefined") {
        return chrome;
    }
    return browser;
}

api.runtime.onInstalled.addListener(handleInstall)
api.runtime.onMessage.addListener(handleMessage);
