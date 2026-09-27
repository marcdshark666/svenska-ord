# Svenska Ord 🇸🇪

Lär dig de vanligaste svenska orden – från A1 till C2 – med översättning till **engelska och polska**.
Gratis, reklamfritt och helt statiskt (vanilla HTML/CSS/JS, inga byggsteg). Körs på GitHub Pages:

**https://marcdshark666.github.io/svenska-ord/**

## Vad finns på sajten

- **Gränssnitt på tre språk:** knappen **SV | EN | PL** i toppen (syns alltid, även inne i lektioner) byter
  allt gränssnitt direkt utan omladdning. Orden som lärs ut är alltid svenska; översättningen följer valt språk
  (engelska → en, polska → pl, svenska → båda). Valet sparas i webbläsaren; första gången gissas det från
  webbläsarens språk (pl → polska, sv → svenska, annars engelska).

- **Alfabetsraden A–Ö** överst (alltid synlig). Tryck på en bokstav: namnet läses upp och en panel visar två
  uttalsexempel – vokal + en konsonant (lång vokal, *tak*) och vokal + två konsonanter (kort vokal, *tack*);
  för konsonanter enkel/dubbel (*hat/hatt*). Allt med översättning till engelska och polska.
- **Nivåkarta A1 → C2** som en stig genom svensk natur (Blomsterängen, Granskogen, Sjön, Fjällen, Norrskenet,
  Kebnekaises topp). Lektionerna är stopp på stigen och låses upp i tur och ordning. Varje nivå slutar med en
  **bosskamp** (svårare övningar, blandar hela nivåns ord). Kan du redan en nivå? "🔑 Hoppa hit" = vinn
  föregående bosskamp med minst 80 %.
- **Övningar:** flerval svenska → engelska/polska och tvärtom, lyssna och välj, skriv ordet (å/ä/ö-knappar,
  förlåtande för saknade prickar), fyll i luckan i exempelmeningen, para ihop, och uttalsövning.
- **Duolingo-mekanik:** XP, streak med levande eld, 5 hjärtan (ett nytt var 20:e minut), dagsmål med
  XP-stapel, stjärnor per lektion, kombobonus, prestationsmärken, repetition av svaga ord (kostar inga hjärtan).
- **Figurer:** Bosse Bäver (vinkar, hoppar vid rätt, tröstar vid fel, firar), Ella Älg och Lilla Lo – egen inline-SVG.
- **Ljud:** uppläsning med `speechSynthesis` och bästa tillgängliga sv-SE-röst (val i ⚙️ Mer), 🐢 långsam uppläsning,
  plus små feedbackpip med Web Audio (kan stängas av). Animationer respekterar `prefers-reduced-motion`.
- **Spela in dig själv** (MediaRecorder) och jämför med förlagan (⇄ Jämför spelar upp båda efter varandra).
  **Uttalskontroll** med SpeechRecognition (sv-SE) i Chrome/Edge; i andra webbläsare visas en tydlig fallback
  (spela in och bedöm själv).
- **Mina ord:** formulär som sparar egna ord i webbläsaren (localStorage) och direkt blir lektionen "Mina ord".
  Export/import som JSON.
- **Spara till GitHub** (valfritt): användaren klistrar in en egen fine-grained token (Contents: read/write för
  repot). Token sparas **bara i den egna webbläsaren** och skickas bara till `api.github.com`. Orden committas till
  `words.json` (lektionen "Tillagda ord"). Ingen token finns eller får finnas i repot.

Allt framsteg sparas i `localStorage` (alla anrop i try/catch – sajten fungerar även i privat läge, men glömmer då).

## Filer

| Fil | Innehåll |
|-----|----------|
| `index.html`, `style.css` | Sidan och stilen (mobil först, mörkt läge) |
| `js/i18n.js` | Gränssnittets texter på svenska, engelska och polska (`t()`, `data-i18n`, språkknappen) |
| `js/dom.js` | Små DOM-hjälpare (all text via `textContent`) |
| `js/tal.js` | Uppläsning, inspelning, taligenkänning, likhetsmått |
| `js/ljud.js` | Feedbackljud med Web Audio |
| `js/figurer.js` | Bosse Bäver, Ella Älg, Lilla Lo (SVG) |
| `js/alfabet.js` | Alfabetsraden med uttalsexempel |
| `js/app.js` | Karta, lektioner, övningar, märken, egna ord, GitHub-sparning |
| `words.json` | Alla ord/fraser (ett per rad för läsbara diffar) |
| `lagg-till-ord.js` | Lägg till ett ord från terminalen |
| `verktyg/ordfil.js` | Gemensam validering/serialisering av `words.json` |
| `verktyg/kontroll.js` | Kontrollerar `words.json` och att alla texter i `js/i18n.js` finns på sv/en/pl |

### Format i `words.json`

```json
{"id":"hund","sv":"hund","en":"dog","pl":"pies","ordklass":"substantiv","lektion":"natur","niva":"B1",
 "ex":{"sv":"Hunden skäller.","en":"The dog is barking.","pl":"Pies szczeka."}}
```

`niva` är A1–C2. Lektioner har `id`, `titel`, `emoji`, `niva` och bosskamper `boss: true` (deras ord är hela nivåns ord).

## Lägga till ord från terminalen

```bash
node lagg-till-ord.js "hund" --en "dog" --pl "pies" --exempel "Hunden skäller." \
  --exempel-en "The dog is barking." --exempel-pl "Pies szczeka." --ordklass substantiv --niva A1
```

Skriptet validerar, stoppar dubbletter (skiftlägesokänsligt), hämtar senaste (`git pull --rebase`), lägger ordet i
lektionen "Tillagda ord", committar och pushar. GitHub Pages uppdateras efter ungefär en minut.
Flaggor: `--ingen-push` (bara lokal commit), `--torrkorning` (visar bara vad som skulle hända), `--lektion <id>`.

## Testa lokalt

```bash
npx serve .            # eller valfri statisk server
node verktyg/kontroll.js
```

Öppna `http://localhost:3000/?sjalvtest=1` – sajten spelar då igenom alla lektioner och alla övningstyper och
skriver `SJALVTEST OK` längst ner (framsteg sparas inte).
