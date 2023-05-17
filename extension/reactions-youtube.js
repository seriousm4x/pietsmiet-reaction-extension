//
// Default values
//

const logTag = " --> [PSRE]";
let settings = {
    showNoReactions: true,
    noReactionsBgColor: "#046931",
    foundReactionsBgColor: "#9b393c",
};
let reactions;
let suggestions;

//
//  Functions
//

async function init() {
    // define browser api
    const api = getBrowser();

    // load settings from storage
    settings = await api.storage.local.get(settings);
    console.log(logTag, "loaded settings");

    // load reactions from storage. if no reactions or outdated, fetch them from github
    reactions = await api.storage.local.get("reactions");
    // 1 hour
    if (
        Object.keys(reactions).length === 0 ||
        Date.now() - reactions.reactions.fetched_at >= 3600000
    ) {
        console.log(logTag, "fetching reactions");
        fetch(
            "https://raw.githubusercontent.com/seriousm4x/pietsmiet-reaction-extension/main/data/matches.min.json"
        )
            .then((res) => res.json())
            .then((data) => {
                const reactionsItem = {
                    fetched_at: Date.now(),
                    videos: data,
                };
                reactions = reactionsItem;
                api.storage.local.set({ reactions: reactionsItem });
            });
    } else {
        reactions = reactions.reactions;
    }
    console.log(logTag, "loaded reactions");

    // load suggestions from storage. if no suggestions or outdated, fetch them from github
    suggestions = await api.storage.local.get("suggestions");
    // 1 hour
    if (
        Object.keys(suggestions).length === 0 ||
        Date.now() - suggestions.suggestions.fetched_at >= 3600000
    ) {
        console.log(logTag, "fetching suggestions");
        fetch(
            "https://raw.githubusercontent.com/seriousm4x/pietsmiet-reaction-extension/main/data/suggestions.min.json"
        )
            .then((res) => res.json())
            .then((data) => {
                const suggestionsItem = {
                    fetched_at: Date.now(),
                    videos: data,
                };
                suggestions = suggestionsItem;
                api.storage.local.set({ suggestions: suggestionsItem });
            });
    } else {
        suggestions = suggestions.suggestions;
    }
    console.log(logTag, "loaded suggestions");

    // observe youtube page for elements
    runObserver();
}

function getBrowser() {
    if (typeof chrome !== "undefined") {
        return chrome;
    }
    return browser;
}

function runObserver() {
    // wait for elements to be created
    const callback = function (mutationsList, observer) {
        // fast url check before search whole html dom
        if (window.location.pathname !== "/watch") {
            return;
        }
        for (const mutation of mutationsList) {
            // if this element id gets created, we know that "#above-the-fold" exists to create our container
            if (mutation.target.id === "microformat") {
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
    const aboveTheFold = document.querySelector("#above-the-fold");
    const reactionBox = document.createElement("div");
    reactionBox.id = "pietsmiet-reaction-container";
    reactionBox.style.fontSize = "1.4rem";
    reactionBox.style.marginTop = "12px";
    reactionBox.style.padding = "1rem";
    reactionBox.style.borderRadius = "12px";

    // create message
    const title = document.createElement("p");
    title.style.fontWeight = "bold";
    const content = document.createElement("div");

    if (reactions.videos[videoId]) {
        // reaction exists
        console.log(logTag, "reaction found:", reactions.videos[videoId]);
        const countReactions = reactions.videos[videoId].length;
        reactionBox.style.backgroundColor = settings.foundReactionsBgColor;
        title.innerText =
            countReactions === 1
                ? "1 React gefunden:"
                : `${countReactions} Reacts gefunden:`;
        const reactsList = document.createElement("ul");
        reactsList.style.paddingLeft = "2rem";
        reactions.videos[videoId].forEach((react) => {
            const published = Date.parse(react.published_at);
            const li = document.createElement("li");
            li.style.cssText =
                "padding-top: 0.5rem; list-style-type: '👉'; padding-inline-start: 1ch;";

            const a = document.createElement("a");
            a.href = "https://youtube.com/watch?v=" + react.reaction_id;
            a.target = "_blank";
            a.style.cssText = "color: white;";
            a.innerText = react.title;
            li.appendChild(a);

            const br = document.createElement("br");
            li.appendChild(br);

            const span = document.createElement("span");
            span.style.cssText = "font-weight: normal;";
            span.innerText =
                "Hochgeladen: " +
                new Date(published).toLocaleDateString("de-DE");
            li.appendChild(span);

            reactsList.appendChild(li);
        });
        content.appendChild(reactsList);
    } else {
        // reaction doesn't exist
        console.log(logTag, "no reaction found");
        if (!settings.showNoReactions) {
            console.log(logTag, "skipping html create");
            return;
        }
        reactionBox.style.backgroundColor = settings.noReactionsBgColor;
        title.innerText = "Kein React gefunden";
        if (suggestions.videos[videoId]) {
            const stats = document.createElement("p");
            stats.style.paddingTop = "1rem";

            const tagCount = document.createElement("span");
            tagCount.style.backgroundColor = "#3a3a3a";
            tagCount.style.padding = "0.2rem 0.4rem";
            tagCount.style.borderRadius = "0.3rem";
            tagCount.innerText = `${suggestions.videos[videoId].count} ${
                suggestions.videos[videoId].count === 1
                    ? "offenen Vorschlag"
                    : "offene Vorschläge"
            }`;

            const tagLikes = document.createElement("span");
            tagLikes.style.backgroundColor = "#009943";
            tagLikes.style.padding = "0.2rem 0.4rem";
            tagLikes.style.borderRadius = "0.3rem";
            tagLikes.innerText = `${suggestions.videos[videoId].likes} 👍`;

            const tagDislikes = document.createElement("span");
            tagDislikes.style.backgroundColor = "#9b393c";
            tagDislikes.style.padding = "0.2rem 0.4rem";
            tagDislikes.style.borderRadius = "0.3rem";
            tagDislikes.innerText = `${suggestions.videos[videoId].dislikes} 👎`;

            stats.innerHTML = `<strong>Infos von PietSmiet.de:</strong><br>Dieses Video hat insgesamt ${tagCount.outerHTML} und hat dabei ${tagLikes.outerHTML} und ${tagDislikes.outerHTML}.`;

            content.appendChild(stats);
        } else {
            title.innerText = title.innerText + " (und 0 offene Vorschläge)";
        }
    }

    // insert element
    reactionBox.appendChild(title);
    reactionBox.appendChild(content);
    aboveTheFold.insertBefore(reactionBox, aboveTheFold.children[2]);
}

//
// Run things
//

console.log(logTag, "starting pietsmiet reaction extension");
init();
