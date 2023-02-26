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

const querySelectorSingle = "#main > div:nth-child(2) > div.mb-10 > div";
const querySelectorMultiple =
    "#main > div:nth-child(2) > div > div.mt-6 > div.flex.flex-col-reverse";
const querySelectorPagination =
    "#main > div:nth-child(2) > div > div.mt-6 > div.pagination.flex.justify-center.my-4";
const querySelectorUpvoteDiv =
    "div.flex.flex-shrink-0.items-center.justify-center.w-full > div";

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
    if (
        Object.keys(reactions).length === 0 ||
        Date.now() - reactions.reactions.fetched_at >= 3600000
    ) {
        // 1 hour
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

    // observe youtube page for elements
    runObserver();
}

function createHtmlSingle(div) {
    const a = div.querySelector(
        "div.flex-grow.border-l-0.lg\\:border-l.border-gray-200 > div:nth-child(2) > div > a"
    );
    if (!a) {
        return;
    }
    const regexMatches = regexYt(a.href);
    if (!regexMatches) {
        return;
    }
    const videoId = regexMatches[1];

    // get divs
    const upvoteDiv = div.querySelector(querySelectorUpvoteDiv);

    if (reactions.videos[videoId]) {
        // reaction exists
        console.log(logTag, "reaction found:", reactions.videos[videoId]);
        const countReactions = reactions.videos[videoId].length;

        // set css
        upvoteDiv.parentElement.style.backgroundColor =
            settings.foundReactionsBgColor;

        // create our message
        const messageDiv = document.createElement("a");
        messageDiv.href =
            "https://youtube.com/watch?v=" + reactions.videos[videoId][0].reaction_id;
        messageDiv.target = "_blank";
        messageDiv.classList = "text-center font-bold mt-1 p-3";
        messageDiv.innerText =
            countReactions === 1
                ? "1 React gefunden"
                : `${countReactions} Reacts gefunden`;
        upvoteDiv.appendChild(messageDiv);
    } else {
        // reaction doesn't exist
        console.log(logTag, "no reaction found");
        if (!settings.showNoReactions) {
            console.log(logTag, "skipping html create");
            return;
        }
        // set css
        upvoteDiv.parentElement.style.backgroundColor = settings.noReactionsBgColor;

        // create our message
        const messageDiv = document.createElement("div");
        messageDiv.classList = "text-center font-bold mt-1 p-3";
        messageDiv.innerText = "Kein React gefunden";
        upvoteDiv.appendChild(messageDiv);
    }
}

function createHtmlMultiple(divs) {
    divs.forEach((div) => {
        createHtmlSingle(div);
    });
}

function runObserver() {
    let builtHtml = false;
    let addedSearchListener = false;
    let searchEl;
    // observer runs on full page load
    const callback = function (mutationsList, observer) {
        if (window.location.pathname === "/community/suggestions") {
            for (const _ of mutationsList) {
                if (!builtHtml) {
                    const divs = document.querySelectorAll(querySelectorMultiple);
                    if (divs.length > 0) {
                        createHtmlMultiple(divs);
                        builtHtml = true;
                    }
                }
                if (!addedSearchListener) {
                    searchEl = document.querySelector("#suggestions_search");
                    if (!!searchEl) {
                        searchEl.addEventListener("input", () => {
                            builtHtml = false;
                            observer.disconnect();
                            observer.observe(document.body, {
                                childList: true,
                                subtree: true,
                            });
                        });
                        addedSearchListener = true;
                    }
                }
                if (builtHtml && addedSearchListener) {
                    return;
                }
            }
        } else if (window.location.pathname.startsWith("/community/suggestions/")) {
            for (const _ of mutationsList) {
                const div = document.querySelector(querySelectorSingle);
                if (div) {
                    observer.disconnect();
                    createHtmlSingle(div);
                    return;
                }
            }
        }
    };
    const observer = new MutationObserver(callback);
    observer.observe(document.body, { childList: true, subtree: true });

    // event listener runs on spa route change
    let currentUrl = location.href;
    const checkPageTransition = () => {
        requestAnimationFrame(() => {
            if (currentUrl !== location.href) {
                currentUrl = location.href;
                builtHtml = false;
                addedSearchListener = false;
                observer.disconnect();
                observer.observe(document.body, { childList: true, subtree: true });
            }
        }, true);
    };
    window.addEventListener("click", checkPageTransition);
    window.addEventListener("popstate", checkPageTransition);
}

function regexYt(url) {
    const r = new RegExp(
        String.raw`(?:https?:\/\/)?(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})`
    );
    return r.exec(url);
}

function getBrowser() {
    if (typeof chrome !== "undefined") {
        return chrome;
    }
    return browser;
}

//
// Run things
//

console.log(logTag, "starting pietsmiet reaction extension");
init();
