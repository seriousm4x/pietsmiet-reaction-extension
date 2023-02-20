<div align="center" width="100%">
    <img src="extension/icons/128.png" width="128" />
</div>

<div align="center" width="100%">
    <h2>PietSmiet Reaction Extension</h2>
    <p>Ein simpler Banner unter Youtube Videos zeigt an, ob auf das Video schon reagiert wurde. Das Ziel des Ganzen ist dabei den Jungs zu helfen, weniger auf dopplte Videos zu reagieren. Ob das klappt? Wir werden's sehen 😅</p>
    <a target="_blank" href="https://github.com/seriousm4x/pietsmiet-reaction-extension/actions"><img src="https://img.shields.io/chrome-web-store/v/cmeffgcdjkledgkgonnfjpnlfelpfbkf" /></a>
    <a target="_blank" href="https://addons.mozilla.org/de/firefox/addon/pietsmiet-reactions-youtube/"><img src="https://img.shields.io/amo/v/pietsmiet-reactions-youtube" /></a>
    <a target="_blank" href="https://github.com/seriousm4x/pietsmiet-reaction-extension/commits/main"><img src="https://img.shields.io/github/last-commit/seriousm4x/pietsmiet-reaction-extension" /></a>
    <a target="_blank" href="https://github.com/seriousm4x/pietsmiet-reaction-extension/actions"><img src="https://github.com/seriousm4x/pietsmiet-reaction-extension/actions/workflows/update.yml/badge.svg" /></a>
    <a target="_blank" href="https://github.com/seriousm4x/pietsmiet-reaction-extension/blob/main/LICENSE"><img src="https://img.shields.io/github/license/seriousm4x/pietsmiet-reaction-extension" /></a>
</div>

## **Screenshots**

| Gefunden                    | Nicht gefunden             |
| --------------------------- | -------------------------- |
| ![](./assets/yep-react.jpg) | ![](./assets/no-react.jpg) |

## **Getestete Browser**

Folgende Liste hab ich getestet. Andere Browser sollten auch ohne Probleme klappen

- Chrome 109.0.5414.120
- Edge 110.0.1587.50
- Brave 1.48.167
- Firefox 110.0

## **Wie funktioniert das Ganze?**

1. Ich verwende die Youtube Api um alle Videos der "Uploads" Playlist des [@PietSmietTV](https://www.youtube.com/@PietSmietTV)-Kanals abzufragen. Die ganze Abfrage wird in [youtube.json](./data/youtube.json) gespeichert.
2. Dann wird der Titel nach "react" durchsucht und geprüft, ob die Beschreibung "Original(-)Video" enthält (das - ist optional), um sicher zu gehen, dass das Video auch wirklich verlinkt ist. Wenn beides zutrifft, wird die Beschreibung nach YouTube-Links durchsucht und dann in [matches.json](./data/matches.json) geschrieben.
3. Github Actions führt immer um 00:00 Uhr einen Workflow aus, der die Matches aufgrund der täglichen Video-Uploads neu generiert.
4. Die Browser Extension holt sich dann die [matches.min.json](./data/matches.min.json), prüft ob die aktuelle VideoID der Browser URL in den Matches enthalten ist und fügt entsprechend die Box unter dem Video ein.
