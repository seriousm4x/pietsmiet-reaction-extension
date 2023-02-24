//
// Default values
//

let api;
let settings = {};
let defaultSettings = {
    showNoReactions: true,
    foundReactionsBgColor: "#9b393c",
    noReactionsBgColor: "#046931",
};
let resetTimeout;

//
//  Functions
//

async function init() {
    // define browser api and load storage
    api = getBrowser();
    const getSettings = await api.runtime.sendMessage({ message: "getSettings" });
    settings = getSettings;
    const getReactions = await api.runtime.sendMessage({ message: "getReactions" });
    const reactions = getReactions.reactions
    console.log(settings);

    // create color pickers
    const pickrFoundReactionsBgColor = Pickr.create({
        el: '#pickrFoundReactionsBgColor',
        theme: 'nano',
        default: settings.foundReactionsBgColor,
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                input: true,
                save: true
            }
        }
    });
    const pickrNoReactionsBgColor = Pickr.create({
        el: '#pickrNoReactionsBgColor',
        theme: 'nano',
        default: settings.noReactionsBgColor,
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                input: true,
                save: true
            }
        }
    });
    pickrFoundReactionsBgColor.on('save', e => {
        settings.foundReactionsBgColor = e.toHEXA().toString()
        api.runtime.sendMessage({ message: "saveSettings", settings: settings })
    })
    pickrNoReactionsBgColor.on('save', e => {
        settings.noReactionsBgColor = e.toHEXA().toString()
        api.runtime.sendMessage({ message: "saveSettings", settings: settings })
    })

    // set infosList
    const infosList = document.querySelector('#infosList')
    const reactionsCount = document.createElement("li")
    reactionsCount.textContent = "Gefundede Reacts: " + Object.keys(reactions.videos).length.toLocaleString("de-DE")
    infosList.appendChild(reactionsCount)

    // set fetched_at date
    const dateUpdated = document.createElement("li")
    const d = new Date(reactions.fetched_at)
    dateUpdated.textContent = `Stand: ${d.toLocaleDateString("de-DE")} um ${d.toLocaleTimeString("de-DE")} Uhr`
    infosList.appendChild(dateUpdated)

    // set version
    const version = document.querySelector('#version')
    const versionLink = document.createElement("a")
    versionLink.textContent = `Version: ${api.runtime.getManifest().version}`
    versionLink.href = "https://github.com/seriousm4x/pietsmiet-reaction-extension"
    versionLink.target = "_blank"
    version.appendChild(versionLink)

    // listener btnShowNoReactions
    const btnShowNoReactions = document.querySelector("#btnShowNoReactions");
    setBtnShowNoReactions(btnShowNoReactions, settings.showNoReactions)
    btnShowNoReactions.addEventListener("click", (e) => {
        settings.showNoReactions = !settings.showNoReactions;
        api.runtime.sendMessage({ message: "saveSettings", settings: settings })
        setBtnShowNoReactions(e.target, settings.showNoReactions)
    });

    // listener btnResetColors
    const btnResetColors = document.querySelector("#btnResetColors");
    btnResetColors.addEventListener('click', () => {
        // reset timeout
        if (typeof resetTimeout === "number") {
            clearTimeout(resetTimeout)
        }

        // save to storage
        settings.foundReactionsBgColor = defaultSettings.foundReactionsBgColor
        settings.noReactionsBgColor = defaultSettings.noReactionsBgColor
        api.runtime.sendMessage({ message: "saveSettings", settings: settings })

        // change input values
        pickrFoundReactionsBgColor.setColor(settings.foundReactionsBgColor)
        pickrNoReactionsBgColor.setColor(settings.noReactionsBgColor)
        btnResetColors.textContent = "✅ Farben zurückgesetzt"
        resetTimeout = setTimeout(() => {
            btnResetColors.textContent = "↩️ Farben zurücksetzen"
        }, 2000);
    })
}

function getBrowser() {
    if (typeof chrome !== "undefined") {
        return chrome;
    }
    return browser;
}

function setBtnShowNoReactions(btn, isEnabled) {
    if (isEnabled) {
        btn.textContent = "✅ Aktiviert";
        btn.style.backgroundColor = "var(--ps-green)";
    } else {
        btn.textContent = "❌ Deaktiviert";
        btn.style.backgroundColor = "var(--bg-danger)";
    }
}

//
// Run things
//

init();
