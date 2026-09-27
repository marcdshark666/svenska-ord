# Svenska Ord – regler för AI-agenter (Claude, Codex, Antigravity)

Läs `../.agents/PROTOKOLL.md` först. Tillståndsnivå: **fri** – push/deploy OK, men **inget som kostar pengar**.

## Vad projektet är
Statisk språksajt (GitHub Pages, repo `marcdshark666/svenska-ord`, gren `main`, rot `/`) för att lära sig svenska
A1–C2 med översättning till engelska och polska. Allt UI på svenska. Se `README.md`.
Live: https://marcdshark666.github.io/svenska-ord/

## Lägga till ord (vanligaste uppdraget)
```bash
node lagg-till-ord.js "ord" --en "english" --pl "polski" [--exempel "Svensk mening."] \
  [--exempel-en "..."] [--exempel-pl "..."] [--ordklass substantiv] [--niva A1]
```
Validerar, stoppar dubbletter, committar och pushar själv. Kör `--torrkorning` först om du är osäker.
Använd bara korrekt svenska och korrekt polska/engelska. Kontrollera efteråt: `node verktyg/kontroll.js`.

## Regler
- Inga byggsteg, inga ramverk, inga externa bilder/CDN – allt ligger i repot.
- All användartext sätts med `textContent` (`DOM.h`), aldrig `innerHTML`. Undantag: de konstanta SVG-figurerna i `js/figurer.js`.
- `localStorage` alltid i try/catch. GitHub-token får **aldrig** hamna i repot, loggar eller commits.
- `words.json` skrivs med ett ord per rad (`verktyg/ordfil.js` `serialisera`) – samma format i webbläsaren (`app.js`).
- Nya övningstyper/lektioner: kör `?sjalvtest=1` lokalt – ska visa `SJALVTEST OK`.
- Respektera `prefers-reduced-motion` för nya animationer.
