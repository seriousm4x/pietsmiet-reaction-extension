//
// Default values
//

const logTag = " --> [PSRE]"
let settings = {
    showNoReactions: true,
    noReactionsBgColor: "#046931", // green bg
    foundReactionsBgColor: "#9b393c", // red bg
}
let reactions;

//
//  Functions
//

async function init() {
    // define browser api
    const api = getBrowserApi()

    // load settings from storage
    settings = await api.storage.local.get(settings)
    console.log(logTag, "loaded settings");

    // load reactions from storage. if no reactions or outdated, fetch them from github
    reactions = await api.storage.local.get("reactions")
    if (Object.keys(reactions).length === 0 || Date.now() - reactions.reactions.fetched_at >= 3600000) { // 1 hour
        console.log(logTag, "fetching reactions");
        fetch("https://raw.githubusercontent.com/seriousm4x/pietsmiet-reaction-extension/main/data/matches.min.json")
            .then(res => res.json())
            .then(data => {
                const reactionsItem = {
                    fetched_at: Date.now(),
                    videos: data,
                };
                reactions = reactionsItem
                api.storage.local.set({ reactions: reactionsItem });
            })
    } else {
        reactions = reactions.reactions
    }
    console.log(logTag, "loaded reactions");

    // observe youtube page for elements
    runObserver()
}

function getBrowserApi() {
    let api;
    if (browser !== undefined) {
        api = browser
    } else {
        api = chrome
    }
    return api
}

function runObserver() {
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
}

function createHTML() {
    // remove our container if it exists
    if (document.querySelector("#pietsmiet-reaction-container")) {
        document.querySelector("#pietsmiet-reaction-container").remove();
    }

    // get video id from url
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const videoId = urlParams.get("v");

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

    if (reactions.videos[videoId]) {
        // reaction exists
        console.log(logTag, "reaction found:", reactions.videos[videoId]);
        reactionBox.style.backgroundColor = settings.foundReactionsBgColor;
        reactionMessage.innerText = "Reacts gefunden:";
        const reactsList = document.createElement("ul");
        reactsList.style.paddingLeft = "2rem";
        reactions.videos[videoId].forEach((react) => {
            const published = Date.parse(react.published_at);
            const li = document.createElement("li");
            li.style.cssText = "padding-top: 0.5rem; list-style-type: '👉'; padding-inline-start: 1ch;";

            const a = document.createElement("a")
            a.href = "https://youtube.com/watch?v=" + react.reaction_id
            a.target = "_blank"
            a.style.cssText = "color: white;"
            a.textContent = react.title
            li.appendChild(a)

            const br = document.createElement("br")
            li.appendChild(br)

            const span = document.createElement("span")
            span.style.cssText = "font-weight: normal;"
            span.textContent = "Hochgeladen: " + new Date(
                published
            ).toLocaleDateString("de-DE")
            li.appendChild(span)

            reactsList.appendChild(li);
        });
        reactionMessage.appendChild(reactsList);
    } else {
        // reaction doesn't exist
        console.log(logTag, "no reaction found");
        if (!settings.showNoReactions) {
            console.log(logTag, "skipping html create");
            return
        }
        reactionBox.style.backgroundColor = settings.noReactionsBgColor;
        reactionMessage.textContent = "Kein React gefunden";
    }

    // insert element
    reactionBox.appendChild(reactionMessage);
    aboveTheFold.insertBefore(reactionBox, aboveTheFold.children[2]);
}

//
// Run things
//

console.log(logTag, "starting pietsmiet reaction extension");
init()
