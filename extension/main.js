let api;
if (typeof chrome !== undefined) {
    api = chrome;
} else if (typeof browser !== undefined) {
    api = browser;
}

let logPreTag = "[pietsmiet reactions]";
let storageItem = getStorageItem();

function setStorageItem() {
    // get videos from github
    fetch(
        "https://raw.githubusercontent.com/seriousm4x/pietsmiet-reaction-extension/main/data/matches.min.json"
    )
        .then((res) => res.json())
        .then((data) => {
            storageItem = {
                fetched_at: Date.now(),
                videos: data,
            };
            api.storage.local.set({ pietsmietReactions: storageItem });
        });
}

function getStorageItem() {
    api.storage.local.get("pietsmietReactions").then((res) => {
        return res.pietsmietReactions;
    });
}

function createHTML() {
    // get video id from url
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const videoId = urlParams.get("v");

    // remove our container if it exists
    if (document.querySelector("#pietsmiet-reaction-container")) {
        document.querySelector("#pietsmiet-reaction-container").remove();
    }

    // create div
    let aboveTheFold = document.querySelector("#above-the-fold");
    const reactionBox = document.createElement("div");
    reactionBox.id = "pietsmiet-reaction-container";
    reactionBox.style.fontSize = "1.4rem";
    reactionBox.style.marginTop = "12px";
    reactionBox.style.padding = "1rem";
    reactionBox.style.borderRadius = "12px";

    // create message
    const reactionMessage = document.createElement("p");
    reactionMessage.style.fontWeight = "bold";

    if (storageItem.videos[videoId]) {
        // reaction exists
        reactionBox.style.backgroundColor = "#046931"; // green bg
        reactionMessage.innerHTML = "Reacts gefunden:";
        const reactsList = document.createElement("ul");
        reactsList.style.paddingLeft = "2rem";
        storageItem.videos[videoId].forEach((react) => {
            const published = Date.parse(react.published_at);
            const li = document.createElement("li");
            li.style.paddingTop = "0.5rem";
            li.innerHTML = `<a href="https://youtube.com/watch?v=${
                react.reaction_id
            }" target="_blank" style="color: white;">${
                react.title
            }</a><br><span style="font-weight: normal;">Hochgeladen: ${new Date(
                published
            ).toLocaleDateString("de-DE")}</span>`;
            reactsList.appendChild(li);
        });
        reactionMessage.appendChild(reactsList);
    } else {
        // reaction doesn't exist
        reactionBox.style.backgroundColor = "#cc181e"; // red bg
        reactionMessage.textContent = "Kein React gefunden";
    }

    // insert element
    reactionBox.appendChild(reactionMessage);
    aboveTheFold.insertBefore(reactionBox, aboveTheFold.children[2]);
}

// set storage
if (storageItem === undefined) {
    setStorageItem();
} else {
    storageItem = getStorageItem();
    // fetch new videos if localstorage older than 1h
    if (Date.now() - storageItem.fetched_at >= 3600000) {
        setStorageItem();
    }
}

// wait for youtube elements to be created
const callback = function (mutationsList, observer) {
    // fast url check before search whole html dom
    if (window.location.pathname !== "/watch") {
        return;
    }
    for (const mutation of mutationsList) {
        if (
            mutation.target.id === "bottom-row" &&
            document.querySelector("#above-the-fold")
        ) {
            observer.disconnect();
            createHTML();
            return;
        }
    }
};
const observer = new MutationObserver(callback);
observer.observe(document.body, { childList: true, subtree: true });

// watch for SPA page event
window.addEventListener(
    "yt-navigate-finish",
    () => {
        // fast url check before search whole html dom
        if (window.location.pathname !== "/watch") {
            return;
        }
        if (document.querySelector("#above-the-fold")) {
            createHTML();
        }
    },
    true
);
