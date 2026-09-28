/* i18n.js – gränssnittets språk: svenska, engelska och polska.
 * Varje nyckel har exakt tre värden [sv, en, pl]. Värdet kan vara en sträng, en lista (tips m.m.)
 * eller ett pluralobjekt ({one, other} / {one, few, many, other}) som väljs med Intl.PluralRules.
 * {namn} i texten byts mot vars.namn. Statisk HTML översätts med data-i18n / data-i18n-<attribut>.
 * Orden som lärs ut är alltid svenska – bara gränssnittet byter språk.
 * Filen fungerar även i Node (verktyg/kontroll.js läser ORDBOK). */
(function (rot) {
  'use strict';

  const SPRAK = ['sv', 'en', 'pl'];
  const SPRAK_INFO = {
    sv: { namn: 'Svenska', flagga: '🇸🇪', kod: 'SV' },
    en: { namn: 'English', flagga: '🇬🇧', kod: 'EN' },
    pl: { namn: 'Polski', flagga: '🇵🇱', kod: 'PL' }
  };
  const NYCKEL = 'svenskaord.sprak';

  // ---------------- Ordboken: nyckel -> [sv, en, pl] ----------------
  const ORDBOK = {
    // Sidan
    'sida.titel': ['Svenska Ord – lär dig de vanligaste svenska orden', 'Svenska Ord – learn the most common Swedish words', 'Svenska Ord – naucz się najczęstszych szwedzkich słów'],
    'sida.beskrivning': [
      'Lär dig de vanligaste svenska orden med översättning till engelska och polska. Lektioner, uppläsning, inspelning och uttalskontroll – gratis och reklamfritt.',
      'Learn the most common Swedish words with English and Polish translations. Lessons, read-aloud, recording and pronunciation checks – free and ad-free.',
      'Naucz się najczęstszych szwedzkich słów z tłumaczeniem na angielski i polski. Lekcje, odczyt na głos, nagrywanie i sprawdzanie wymowy – za darmo i bez reklam.'],
    'hoppa': ['Hoppa till innehållet', 'Skip to content', 'Przejdź do treści'],
    'logga.aria': ['Svenska Ord – startsidan', 'Svenska Ord – home', 'Svenska Ord – strona główna'],
    'alfa.aria': ['Svenska alfabetet', 'The Swedish alphabet', 'Alfabet szwedzki'],
    'laddar': ['Laddar orden…', 'Loading words…', 'Ładowanie słów…'],
    'nav.aria': ['Huvudmeny', 'Main menu', 'Menu główne'],
    'nav.hem': ['Lär dig', 'Learn', 'Nauka'],
    'nav.ordlista': ['Ordlista', 'Word list', 'Słownik'],
    'nav.mina': ['Mina ord', 'My words', 'Moje słowa'],
    'nav.profil': ['Profil', 'Profile', 'Profil'],
    'nav.mer': ['Mer', 'More', 'Więcej'],
    'nav.kort': ['Kort', 'Cards', 'Fiszki'],
    'nav.samtal': ['Prata', 'Talk', 'Rozmowa'],
    // Samtalsläget (js/samtal.js)
    'samtal.rubrik': ['Prata med Bosse', 'Talk with Bosse', 'Rozmawiaj z Bosse'],
    'samtal.info': ['Jag pratar svenska med dig. Svara med rösten – jag rättar dig om något blir fel. Tio minuter om dagen räcker långt!', 'I speak Swedish with you. Answer with your voice – I’ll correct you if something is off. Ten minutes a day goes a long way!', 'Mówię do ciebie po szwedzku. Odpowiadaj głosem – poprawię cię, gdy coś pójdzie nie tak. Dziesięć minut dziennie to naprawdę dużo!'],
    'samtal.hemText': ['Öva riktiga samtal med rösten – från hälsningar till debatter.', 'Practise real conversations with your voice – from greetings to debates.', 'Ćwicz prawdziwe rozmowy głosem – od powitań po debaty.'],
    'samtal.hemKnapp': ['Börja prata', 'Start talking', 'Zacznij mówić'],
    'samtal.hjalpsprak': ['Hjälp på:', 'Help in:', 'Pomoc po:'],
    'samtal.steg': [
      { one: '{n} replik', other: '{n} repliker' },
      { one: '{n} line', other: '{n} lines' },
      { one: '{n} kwestia', few: '{n} kwestie', many: '{n} kwestii', other: '{n} kwestii' }],
    'samtal.bast': ['Bäst: {s}', 'Best: {s}', 'Najlepszy wynik: {s}'],
    'samtal.tillbaka': ['Alla samtal', 'All conversations', 'Wszystkie rozmowy'],
    'samtal.startInfo': ['Bosse pratar svenska. Tryck på mikrofonen och svara – eller skriv och välj svar.', 'Bosse speaks Swedish. Tap the microphone and answer – or type or choose an answer.', 'Bosse mówi po szwedzku. Dotknij mikrofonu i odpowiedz – albo wpisz lub wybierz odpowiedź.'],
    'samtal.starta': ['Starta samtalet', 'Start the conversation', 'Zacznij rozmowę'],
    'samtal.mik': ['Tryck och prata', 'Tap and speak', 'Dotknij i mów'],
    'samtal.lyssnar': ['Jag lyssnar … prata nu', 'Listening … speak now', 'Słucham … mów teraz'],
    'samtal.vanta': ['Bosse pratar …', 'Bosse is talking …', 'Bosse mówi …'],
    'samtal.dinTur': ['Din tur – skriv eller välj svar', 'Your turn – type or choose an answer', 'Twoja kolej – wpisz lub wybierz odpowiedź'],
    'samtal.hjalp': ['Hjälp', 'Hint', 'Podpowiedź'],
    'samtal.skriv': ['Skriv', 'Type', 'Napisz'],
    'samtal.valj': ['Välj svar', 'Choose', 'Wybierz'],
    'samtal.skicka': ['Skicka', 'Send', 'Wyślij'],
    'samtal.hoppa': ['Gå vidare', 'Skip', 'Dalej'],
    'samtal.faltEtikett': ['Skriv ditt svar på svenska', 'Type your answer in Swedish', 'Wpisz odpowiedź po szwedzku'],
    'samtal.duKanSaga': ['Du kan säga:', 'You can say:', 'Możesz powiedzieć:'],
    'samtal.upprepa': ['Lyssna igen', 'Listen again', 'Posłuchaj jeszcze raz'],
    'samtal.ratt': ['Rätt', 'Correct', 'Dobrze'],
    'samtal.fel': ['Inte riktigt', 'Not quite', 'Nie całkiem'],
    'samtal.ingenMik': ['Din webbläsare kan inte lyssna på tal (det fungerar i Chrome, Edge och Safari på iPhone). Skriv ditt svar eller välj bland alternativen.', 'Your browser can’t listen to speech (it works in Chrome, Edge and Safari on iPhone). Type your answer or choose from the options.', 'Twoja przeglądarka nie rozpoznaje mowy (działa w Chrome, Edge i Safari na iPhonie). Wpisz odpowiedź albo wybierz z listy.'],
    'samtal.klar': ['Samtalet är klart!', 'Conversation complete!', 'Rozmowa zakończona!'],
    'samtal.resultat': ['{ratt} av {alla} rätt på första försöket', '{ratt} of {alla} right on the first try', '{ratt} z {alla} dobrze za pierwszym razem'],
    'samtal.igen': ['Prata igen', 'Talk again', 'Porozmawiaj jeszcze raz'],
    'samtal.fler': ['Fler samtal', 'More conversations', 'Więcej rozmów'],
    'samtal.saknas': ['Samtalet finns inte.', 'That conversation doesn’t exist.', 'Taka rozmowa nie istnieje.'],
    'samtal.laddaFel': ['Samtalen kunde inte laddas: {fel}', 'Could not load the conversations: {fel}', 'Nie udało się wczytać rozmów: {fel}'],
    // Flashcards (js/kort.js)
    'kort.rubrik': ['Flashcards', 'Flashcards', 'Fiszki'],
    'kort.info': ['Framsidan visar ordet på polska och engelska – vänd kortet och se det på svenska. Kort du kan kommer tillbaka mer sällan.', 'The front shows the word in Polish and English – flip the card to see it in Swedish. Cards you know come back less often.', 'Na przodzie jest słowo po polsku i angielsku – odwróć kartę, aby zobaczyć je po szwedzku. Karty, które znasz, wracają rzadziej.'],
    'kort.lek.a1': ['A1 – Nybörjare', 'A1 – Beginner', 'A1 – Początkujący'],
    'kort.lek.a2': ['A2 – Grundläggande', 'A2 – Elementary', 'A2 – Podstawowy'],
    'kort.lek.b1': ['B1 – Medel', 'B1 – Intermediate', 'B1 – Średnio zaawansowany'],
    'kort.lek.b2': ['B2 – Övre medel', 'B2 – Upper intermediate', 'B2 – Wyższy średnio zaawansowany'],
    'kort.lek.c1': ['C1 – Avancerad', 'C1 – Advanced', 'C1 – Zaawansowany'],
    'kort.lek.c2': ['C2 – Mästare', 'C2 – Proficient', 'C2 – Biegły'],
    'kort.lek.medicin': ['Medicin', 'Medicine', 'Medycyna'],
    'kort.antal': [
      { one: '{n} kort', other: '{n} kort' },
      { one: '{n} card', other: '{n} cards' },
      { one: '{n} karta', few: '{n} karty', many: '{n} kart', other: '{n} karty' }],
    'kort.kanAv': ['Du kan {kan} av {alla}', 'You know {kan} of {alla}', 'Znasz {kan} z {alla}'],
    'kort.attRepetera': ['{n} att repetera nu', '{n} to review now', 'Do powtórki teraz: {n}'],
    'kort.nyaKort': ['{n} nya', '{n} new', 'Nowe: {n}'],
    'kort.snart': ['Kommer snart', 'Coming soon', 'Wkrótce'],
    'kort.snartInfo': ['Den här leken är inte klar än. Titta in igen snart!', 'This deck isn’t ready yet. Check back soon!', 'Ta talia nie jest jeszcze gotowa. Zajrzyj wkrótce!'],
    'kort.nollstall': ['Börja om', 'Start over', 'Zacznij od nowa'],
    'kort.nollstallLek': ['Börja om leken {lek}', 'Start the deck {lek} over', 'Zacznij talię {lek} od nowa'],
    'kort.nollstallFraga': ['Börja om leken {lek}? Allt du har lärt dig i leken nollställs.', 'Start the deck {lek} over? Everything you have learned in it will be reset.', 'Zacząć talię {lek} od nowa? Wszystkie postępy w tej talii zostaną wyzerowane.'],
    'kort.allaLekar': ['Alla lekar', 'All decks', 'Wszystkie talie'],
    'kort.kvar': ['{n} kvar i passet', '{n} left in this session', 'Pozostało w sesji: {n}'],
    'kort.lada': ['Låda {n} av 5', 'Box {n} of 5', 'Pudełko {n} z 5'],
    'kort.nytt': ['✨ Nytt kort', '✨ New card', '✨ Nowa karta'],
    'kort.vandTips': ['Tryck för att vända', 'Tap to flip', 'Dotknij, aby odwrócić'],
    'kort.vand': ['Vänd kortet', 'Flip the card', 'Odwróć kartę'],
    'kort.kanInte': ['Kan inte', 'Don’t know', 'Nie znam'],
    'kort.svart': ['Svårt', 'Hard', 'Trudne'],
    'kort.kan': ['Kan', 'Know it', 'Znam'],
    'kort.blanda': ['Blanda', 'Shuffle', 'Przetasuj'],
    'kort.tangenter': ['Mellanslag vänder · 1 2 3 svarar · svep ← →', 'Space flips · 1 2 3 answers · swipe ← →', 'Spacja odwraca · 1 2 3 odpowiada · przesuń ← →'],
    'kort.klartIdag': ['Klart för i dag!', 'All done for today!', 'Na dziś gotowe!'],
    'kort.klartInfo': ['Alla kort i leken är repeterade. Korten kommer tillbaka när det är dags.', 'Every card in the deck has been reviewed. They will come back when it’s time.', 'Wszystkie karty w tej talii są powtórzone. Wrócą, gdy nadejdzie czas.'],
    'kort.spela.pl': ['Lyssna på polska: {text}', 'Listen in Polish: {text}', 'Posłuchaj po polsku: {text}'],
    'kort.spela.en': ['Lyssna på engelska: {text}', 'Listen in English: {text}', 'Posłuchaj po angielsku: {text}'],
    'kort.spela.sv': ['Lyssna på svenska: {text}', 'Listen in Swedish: {text}', 'Posłuchaj po szwedzku: {text}'],
    'kort.ingenRost.pl': ['Webbläsaren har ingen polsk röst – uppläsningen kan låta fel eller utebli.', 'Your browser has no Polish voice – playback may sound wrong or not work.', 'Przeglądarka nie ma polskiego głosu – odczyt może brzmieć źle lub nie zadziałać.'],
    'kort.ingenRost.en': ['Webbläsaren har ingen engelsk röst – uppläsningen kan låta fel eller utebli.', 'Your browser has no English voice – playback may sound wrong or not work.', 'Przeglądarka nie ma angielskiego głosu – odczyt może brzmieć źle lub nie zadziałać.'],
    'kort.ingenRost.sv': ['Webbläsaren har ingen svensk röst – uppläsningen kan låta fel eller utebli.', 'Your browser has no Swedish voice – playback may sound wrong or not work.', 'Przeglądarka nie ma szwedzkiego głosu – odczyt może brzmieć źle lub nie zadziałać.'],
    'kort.ingenUppl': ['Webbläsaren kan inte läsa upp text.', 'Your browser can’t read text aloud.', 'Przeglądarka nie potrafi czytać tekstu na głos.'],
    // Ordboksläget (js/lexikon.js)
    'lex.aria': ['Ordbok', 'Dictionary', 'Słownik'],
    'lex.rubrik': ['📚 Ordbok', '📚 Dictionary', '📚 Słownik'],
    'lex.visa': ['Slå upp {ord} i ordboken', 'Look up {ord} in the dictionary', 'Sprawdź {ord} w słowniku'],
    'lex.laddar': ['Slår upp ordet…', 'Looking up the word…', 'Szukam słowa…'],
    'lex.grundform': ['Grundform:', 'Base form:', 'Forma podstawowa:'],
    'lex.formen': ['(formen i texten: {form})', '(form in the text: {form})', '(forma w tekście: {form})'],
    'lex.oversattning': ['Översättning', 'Translation', 'Tłumaczenie'],
    'lex.ingenOvers.pl': ['Ingen polsk översättning i sajtens ordlistor.', 'No Polish translation in the site’s word lists.', 'Brak polskiego tłumaczenia w słownikach strony.'],
    'lex.ingenOvers.en': ['Ingen engelsk översättning i sajtens ordlistor.', 'No English translation in the site’s word lists.', 'Brak angielskiego tłumaczenia w słownikach strony.'],
    'lex.definition': ['Definition', 'Definition', 'Definicja'],
    'lex.hamtar': ['Hämtar definition från Wiktionary…', 'Fetching the definition from Wiktionary…', 'Pobieram definicję z Wiktionary…'],
    'lex.ingenDef': ['Ingen definition hittades just nu (Wiktionary svarade inte eller saknar ordet).', 'No definition found right now (Wiktionary did not answer or lacks the word).', 'Nie znaleziono teraz definicji (Wiktionary nie odpowiada lub nie ma tego słowa).'],
    'lex.kallaWikt': ['Källa: engelska Wiktionary (CC BY-SA).', 'Source: English Wiktionary (CC BY-SA).', 'Źródło: angielski Wiktionary (CC BY-SA).'],
    'lex.defSv': ['På svenska:', 'In Swedish:', 'Po szwedzku:'],
    'lex.anvandning': ['Användning', 'Usage', 'Użycie'],
    'lex.ingaExempel': ['Inga andra exempelmeningar på sajten ännu.', 'No other example sentences on the site yet.', 'Na stronie nie ma jeszcze innych przykładowych zdań.'],
    'lex.fraser': ['Fraser', 'Phrases', 'Wyrażenia'],
    'lex.saknas': ['Ordet finns inte i sajtens ordlistor – använd länkarna nedan.', 'The word isn’t in the site’s word lists – use the links below.', 'Tego słowa nie ma w słownikach strony – skorzystaj z linków poniżej.'],
    'lex.merOm': ['Mer om ordet', 'More about the word', 'Więcej o słowie'],
    'kort.ovaAnda': ['Öva ändå', 'Practise anyway', 'Ćwicz mimo to'],
    'lektion.aria': ['Lektion', 'Lesson', 'Lekcja'],
    'ordkort.aria': ['Ordkort', 'Word card', 'Karta słowa'],
    'sprak.aria': ['Sidans språk', 'Page language', 'Język strony'],
    'sprak.byt': ['Byt sidans språk till {namn}', 'Switch the page language to {namn}', 'Zmień język strony na {namn}'],
    'stang': ['Stäng', 'Close', 'Zamknij'],
    'fortsatt': ['Fortsätt', 'Continue', 'Dalej'],
    'framsteg': ['Framsteg', 'Progress', 'Postęp'],
    'antalOrd': [
      { one: '{n} ord', other: '{n} ord' },
      { one: '{n} word', other: '{n} words' },
      { one: '{n} słowo', few: '{n} słowa', many: '{n} słów', other: '{n} słowa' }],

    // Språknamn (i löptext)
    'sprak.en.namn': ['engelska', 'English', 'angielski'],
    'sprak.pl.namn': ['polska', 'Polish', 'polski'],

    // Uppläsningsknappar (dom.js)
    'las.upp': ['Läs upp: {text}', 'Read aloud: {text}', 'Odtwórz: {text}'],
    'las.langsamt': ['Läs upp långsamt: {text}', 'Read aloud slowly: {text}', 'Odtwórz powoli: {text}'],
    'langsamt': ['Långsamt', 'Slowly', 'Powoli'],
    'lyssna': ['Lyssna', 'Listen', 'Posłuchaj'],

    // Tal och mikrofon (tal.js)
    'tal.kanInteSpelaIn': ['Din webbläsare kan inte spela in ljud.', 'Your browser cannot record audio.', 'Twoja przeglądarka nie może nagrywać dźwięku.'],
    'tal.mikBlockerad': ['Mikrofonen är blockerad. Tillåt mikrofonen i webbläsarens adressfält och försök igen.', 'The microphone is blocked. Allow the microphone in the browser’s address bar and try again.', 'Mikrofon jest zablokowany. Zezwól na mikrofon w pasku adresu przeglądarki i spróbuj ponownie.'],
    'tal.ingenMik': ['Hittade ingen mikrofon.', 'No microphone found.', 'Nie znaleziono mikrofonu.'],
    'tal.mikFel': ['Kunde inte starta mikrofonen: {fel}', 'Could not start the microphone: {fel}', 'Nie udało się uruchomić mikrofonu: {fel}'],
    'tal.saknas': ['Taligenkänning saknas i den här webbläsaren.', 'Speech recognition is not available in this browser.', 'Rozpoznawanie mowy nie jest dostępne w tej przeglądarce.'],
    'tal.kundeInteStarta': ['Kunde inte starta taligenkänningen.', 'Could not start speech recognition.', 'Nie udało się uruchomić rozpoznawania mowy.'],
    'tal.notAllowed': ['Mikrofonen är blockerad. Tillåt den i adressfältet.', 'The microphone is blocked. Allow it in the address bar.', 'Mikrofon jest zablokowany. Zezwól na niego w pasku adresu.'],
    'tal.serviceNotAllowed': ['Taligenkänningen är avstängd i webbläsaren.', 'Speech recognition is turned off in the browser.', 'Rozpoznawanie mowy jest wyłączone w przeglądarce.'],
    'tal.noSpeech': ['Jag hörde inget. Prova igen och tala lite högre.', 'I didn’t hear anything. Try again and speak a little louder.', 'Nic nie usłyszałem. Spróbuj ponownie i mów trochę głośniej.'],
    'tal.network': ['Taligenkänningen behöver internet.', 'Speech recognition needs an internet connection.', 'Rozpoznawanie mowy wymaga internetu.'],
    'tal.langNotSupported': ['Svenska stöds inte av taligenkänningen här.', 'Swedish is not supported by speech recognition here.', 'Rozpoznawanie mowy nie obsługuje tu szwedzkiego.'],
    'tal.misslyckades': ['Taligenkänningen misslyckades ({kod}).', 'Speech recognition failed ({kod}).', 'Rozpoznawanie mowy nie powiodło się ({kod}).'],
    'tal.hordeInget': ['Jag hörde inget. Prova igen.', 'I didn’t hear anything. Try again.', 'Nic nie usłyszałem. Spróbuj ponownie.'],

    // Figurerna
    'fig.bosse': ['Bosse Bäver', 'Bosse the Beaver', 'Bóbr Bosse'],
    'fig.ella': ['Ella Älg', 'Ella the Moose', 'Łosica Ella'],
    'fig.lo': ['Lilla Lo', 'Little Lo', 'Mała Lo'],
    'fig.figur': ['Figur', 'Character', 'Postać'],
    'fig.bosse.om': ['Bygger dammar och ordförråd.', 'Builds dams and vocabulary.', 'Buduje tamy i słownictwo.'],
    'fig.ella.om': ['Långbent och klok. Älskar idiom.', 'Long-legged and wise. Loves idioms.', 'Długonoga i mądra. Uwielbia idiomy.'],
    'fig.lo.om': ['Nyfiken lodjursunge som hör allt.', 'A curious lynx cub who hears everything.', 'Ciekawskie młode rysia, które wszystko słyszy.'],

    // Alfabetspanelen
    'alfa.uttalas': ['Uttalas: ', 'Pronounced: ', 'Wymowa: '],
    'alfa.lasBokstav': ['Läs upp bokstaven {b}', 'Say the letter {b}', 'Odtwórz literę {b}'],
    'alfa.bokstaven': ['Bokstaven {b}', 'The letter {b}', 'Litera {b}'],
    'alfa.vokal': ['Vokal', 'Vowel', 'Samogłoska'],
    'alfa.konsonant': ['Konsonant', 'Consonant', 'Spółgłoska'],
    'alfa.langVokal': ['Lång vokal – följs av en konsonant', 'Long vowel – followed by one consonant', 'Długa samogłoska – po niej jedna spółgłoska'],
    'alfa.kortVokal': ['Kort vokal – följs av två konsonanter', 'Short vowel – followed by two consonants', 'Krótka samogłoska – po niej dwie spółgłoski'],
    'alfa.enkel': ['Enkel konsonant', 'Single consonant', 'Pojedyncza spółgłoska'],
    'alfa.dubbel': ['Dubbel konsonant', 'Double consonant', 'Podwójna spółgłoska'],
    'alfa.exempel': ['Exempel {n}', 'Example {n}', 'Przykład {n}'],
    'alfa.not.C': ['C låter oftast som s. Dubbel-k skrivs ck.', 'C usually sounds like s. Double k is written ck.', 'C brzmi zwykle jak s. Podwójne k zapisuje się jako ck.'],
    'alfa.not.H': ['H dubbleras aldrig – här två vanliga ord med h.', 'H is never doubled – here are two common words with h.', 'H nigdy się nie podwaja – oto dwa popularne słowa z h.'],
    'alfa.not.J': ['J dubbleras aldrig – här två vanliga ord med j.', 'J is never doubled – here are two common words with j.', 'J nigdy się nie podwaja – oto dwa popularne słowa z j.'],
    'alfa.not.K': ['Dubbel-k skrivs ck.', 'Double k is written ck.', 'Podwójne k zapisuje się jako ck.'],
    'alfa.not.Q': ['Q finns nästan bara i lånord och namn.', 'Q appears almost only in loanwords and names.', 'Q występuje prawie wyłącznie w zapożyczeniach i imionach.'],
    'alfa.not.V': ['V dubbleras nästan aldrig – här två vanliga ord med v.', 'V is almost never doubled – here are two common words with v.', 'V prawie nigdy się nie podwaja – oto dwa popularne słowa z v.'],
    'alfa.not.W': ['W låter som v och finns mest i lånord.', 'W sounds like v and appears mostly in loanwords.', 'W brzmi jak v i występuje głównie w zapożyczeniach.'],
    'alfa.not.X': ['X låter som ks och dubbleras aldrig.', 'X sounds like ks and is never doubled.', 'X brzmi jak ks i nigdy się nie podwaja.'],
    'alfa.not.Z': ['Z låter som s och finns mest i lånord.', 'Z sounds like s and appears mostly in loanwords.', 'Z brzmi jak s i występuje głównie w zapożyczeniach.'],

    // Ordklasser
    'ordklass.substantiv': ['substantiv', 'noun', 'rzeczownik'],
    'ordklass.verb': ['verb', 'verb', 'czasownik'],
    'ordklass.adjektiv': ['adjektiv', 'adjective', 'przymiotnik'],
    'ordklass.adverb': ['adverb', 'adverb', 'przysłówek'],
    'ordklass.pronomen': ['pronomen', 'pronoun', 'zaimek'],
    'ordklass.preposition': ['preposition', 'preposition', 'przyimek'],
    'ordklass.konjunktion': ['konjunktion', 'conjunction', 'spójnik'],
    'ordklass.interjektion': ['interjektion', 'interjection', 'wykrzyknik'],
    'ordklass.räkneord': ['räkneord', 'numeral', 'liczebnik'],
    'ordklass.fras': ['fras', 'phrase', 'wyrażenie'],

    // Nivåer och platser på kartan
    'niva.A1.namn': ['Nybörjare', 'Beginner', 'Początkujący'],
    'niva.A2.namn': ['Grundnivå', 'Elementary', 'Podstawowy'],
    'niva.B1.namn': ['Mellannivå', 'Intermediate', 'Średnio zaawansowany'],
    'niva.B2.namn': ['Övre mellannivå', 'Upper intermediate', 'Wyższy średnio zaawansowany'],
    'niva.C1.namn': ['Avancerad', 'Advanced', 'Zaawansowany'],
    'niva.C2.namn': ['Expert', 'Expert', 'Ekspert'],
    'niva.A1.plats': ['Blomsterängen', 'The Flower Meadow', 'Kwietna łąka'],
    'niva.A2.plats': ['Granskogen', 'The Spruce Forest', 'Świerkowy las'],
    'niva.B1.plats': ['Sjön', 'The Lake', 'Jezioro'],
    'niva.B2.plats': ['Fjällen', 'The Mountains', 'Góry'],
    'niva.C1.plats': ['Norrskenet', 'The Northern Lights', 'Zorza polarna'],
    'niva.C2.plats': ['Kebnekaises topp', 'The Summit of Kebnekaise', 'Szczyt Kebnekaise'],

    // Lektionernas namn (id i words.json). Bosskamper: lekt.boss.
    'lekt.halsningar': ['Hälsningar', 'Greetings', 'Powitania'],
    'lekt.pronomen': ['Pronomen', 'Pronouns', 'Zaimki'],
    'lekt.verb1': ['Viktiga verb 1', 'Important verbs 1', 'Ważne czasowniki 1'],
    'lekt.siffror': ['Siffror', 'Numbers', 'Liczby'],
    'lekt.familj': ['Familj och människor', 'Family and people', 'Rodzina i ludzie'],
    'lekt.mat': ['Mat och dryck', 'Food and drink', 'Jedzenie i picie'],
    'lekt.hemmet': ['Hemmet', 'The home', 'Dom'],
    'lekt.farger': ['Färger och kläder', 'Colours and clothes', 'Kolory i ubrania'],
    'lekt.fraser-a1': ['Första fraserna', 'First phrases', 'Pierwsze zwroty'],
    'lekt.verb2': ['Viktiga verb 2', 'Important verbs 2', 'Ważne czasowniki 2'],
    'lekt.verb3': ['Vardagsverb', 'Everyday verbs', 'Czasowniki na co dzień'],
    'lekt.fragor': ['Frågeord och småord', 'Question words and little words', 'Słowa pytające i drobne słówka'],
    'lekt.tid': ['Tid', 'Time', 'Czas'],
    'lekt.veckan': ['Veckodagar och högtider', 'Weekdays and holidays', 'Dni tygodnia i święta'],
    'lekt.adjektiv1': ['Adjektiv 1', 'Adjectives 1', 'Przymiotniki 1'],
    'lekt.staden': ['Staden och resor', 'The city and travel', 'Miasto i podróże'],
    'lekt.handla': ['Handla och vardag', 'Shopping and everyday life', 'Zakupy i codzienność'],
    'lekt.fraser-a2': ['Vardagsfraser', 'Everyday phrases', 'Zwroty na co dzień'],
    'lekt.verb4': ['Verb i hemmet', 'Verbs at home', 'Czasowniki w domu'],
    'lekt.adjektiv2': ['Adjektiv 2', 'Adjectives 2', 'Przymiotniki 2'],
    'lekt.kroppen': ['Kroppen och hälsa', 'The body and health', 'Ciało i zdrowie'],
    'lekt.arbete': ['Arbete och skola', 'Work and school', 'Praca i szkoła'],
    'lekt.natur': ['Natur och väder', 'Nature and weather', 'Przyroda i pogoda'],
    'lekt.smaord': ['Små ord som binder ihop', 'Little words that link things', 'Małe słowa, które łączą'],
    'lekt.adverb': ['Var, när och hur', 'Where, when and how', 'Gdzie, kiedy i jak'],
    'lekt.kanslor': ['Känslor och livet', 'Feelings and life', 'Uczucia i życie'],
    'lekt.fraser-b1': ['Samtal och åsikter', 'Conversation and opinions', 'Rozmowa i opinie'],
    'lekt.samhalle': ['Samhälle och nyheter', 'Society and news', 'Społeczeństwo i wiadomości'],
    'lekt.diskutera': ['Diskutera och argumentera', 'Discussing and arguing', 'Dyskusja i argumentacja'],
    'lekt.typiskt': ['Typiskt svenskt', 'Typically Swedish', 'Typowo szwedzkie'],
    'lekt.abstrakt': ['Abstrakta ord', 'Abstract words', 'Słowa abstrakcyjne'],
    'lekt.formell': ['Formell svenska', 'Formal Swedish', 'Formalny szwedzki'],
    'lekt.idiom1': ['Idiom och uttryck', 'Idioms and expressions', 'Idiomy i wyrażenia'],
    'lekt.ordsprak': ['Ordspråk', 'Proverbs', 'Przysłowia'],
    'lekt.nyanser': ['Nyanser och stil', 'Nuance and style', 'Niuanse i styl'],
    'lekt.idiom2': ['Fler idiom', 'More idioms', 'Więcej idiomów'],
    'lekt.extra': ['Tillagda ord', 'Added words', 'Dodane słowa'],
    'lekt.mina': ['Mina ord', 'My words', 'Moje słowa'],
    'lekt.boss': ['Bosskamp {niva}', 'Boss battle {niva}', 'Walka z bossem {niva}'],

    // Tips, beröm och tröst (listor)
    'tips': [
      ['Tryck på en bokstav högst upp så hör du hur den låter!',
        'Lång vokal före en konsonant, kort före två: tak – tack, glas – glass.',
        'Å, Ä och Ö är egna bokstäver och kommer sist i alfabetet.',
        'Spela in dig själv och jämför med förlagan – det är så man låter svensk!',
        'Substantiv är antingen en-ord eller ett-ord: en bil, ett hus.',
        'Verb böjs inte efter person: jag är, du är, hon är. Skönt, va?',
        '"Lagom" betyder inte för mycket och inte för lite. Väldigt svenskt!',
        'Fika är både ett substantiv och ett verb. Ska vi fika?',
        'Klara bosskampen för att låsa upp nästa del av kartan.',
        'Repetera svaga ord – det kostar inga hjärtan och ger ett tillbaka.',
        'Byt sidans språk uppe till höger: svenska, engelska eller polska.',
        'Sj-ljudet i sju, sjö och sjuk är typiskt svenskt – lyssna noga och härma!'],
      ['Tap a letter at the top to hear how it sounds!',
        'Long vowel before one consonant, short before two: tak – tack, glas – glass.',
        'Å, Ä and Ö are letters of their own and come last in the alphabet.',
        'Record yourself and compare with the model – that’s how you learn to sound Swedish!',
        'Nouns are either en-words or ett-words: en bil, ett hus.',
        'Verbs don’t change with the person: jag är, du är, hon är. Nice, right?',
        '“Lagom” means not too much and not too little. Very Swedish!',
        'Fika is both a noun and a verb. Ska vi fika? (Shall we have a fika?)',
        'Win the boss battle to unlock the next part of the map.',
        'Review weak words – it costs no hearts and gives you one back.',
        'Switch the page language at the top right: Swedish, English or Polish.',
        'The sj sound in sju, sjö and sjuk is typically Swedish – listen carefully and imitate!'],
      ['Dotknij litery na górze, a usłyszysz, jak brzmi!',
        'Długa samogłoska przed jedną spółgłoską, krótka przed dwiema: tak – tack, glas – glass.',
        'Å, Ä i Ö to osobne litery i są na samym końcu alfabetu.',
        'Nagraj się i porównaj z wzorem – tak nauczysz się brzmieć po szwedzku!',
        'Rzeczowniki są albo en-słowami, albo ett-słowami: en bil, ett hus.',
        'Czasowniki nie odmieniają się przez osoby: jag är, du är, hon är. Wygodne, prawda?',
        '„Lagom” znaczy nie za dużo i nie za mało. Bardzo szwedzkie!',
        'Fika to zarówno rzeczownik, jak i czasownik. Ska vi fika? (Idziemy na fikę?)',
        'Wygraj walkę z bossem, aby odblokować kolejną część mapy.',
        'Powtarzaj słabe słowa – to nie kosztuje serc i oddaje jedno serce.',
        'Zmień język strony w prawym górnym rogu: szwedzki, angielski lub polski.',
        'Dźwięk sj w sju, sjö i sjuk jest typowo szwedzki – słuchaj uważnie i naśladuj!']],
    'berom': [
      ['Snyggt!', 'Kanon!', 'Toppen!', 'Grymt!', 'Helt rätt!', 'Bra jobbat!', 'Suveränt!', 'Klockrent!'],
      ['Nice!', 'Great!', 'Excellent!', 'Awesome!', 'Exactly right!', 'Well done!', 'Superb!', 'Spot on!'],
      ['Ładnie!', 'Super!', 'Świetnie!', 'Rewelacja!', 'Dokładnie tak!', 'Dobra robota!', 'Znakomicie!', 'Idealnie!']],
    'trost': [
      ['Ingen fara – nu kan du det!', 'Nästan! Nästa gång sitter det.', 'Misstag är hur man lär sig.', 'Lugnt, vi tar det igen senare.'],
      ['No worries – now you know it!', 'Almost! Next time it’ll stick.', 'Mistakes are how you learn.', 'Relax, we’ll try it again later.'],
      ['Nic nie szkodzi – teraz już wiesz!', 'Prawie! Następnym razem się uda.', 'Na błędach się uczymy.', 'Spokojnie, powtórzymy to później.']],
    'dagar.kort': [
      ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'],
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb']],

    // Fel vid laddning
    'fel.hamta': ['Kunde inte hämta words.json ({status})', 'Could not fetch words.json ({status})', 'Nie udało się pobrać words.json ({status})'],
    'fel.format': ['words.json har fel format', 'words.json has the wrong format', 'words.json ma nieprawidłowy format'],
    'fel.nagot': ['Något gick fel: {fel}', 'Something went wrong: {fel}', 'Coś poszło nie tak: {fel}'],
    'fel.ladda': ['Kunde inte ladda ordlistan: {fel}. Ladda om sidan.', 'Could not load the word list: {fel}. Reload the page.', 'Nie udało się wczytać słownika: {fel}. Odśwież stronę.'],

    // Märken
    'marke.toast': ['{ikon} Nytt märke: {namn}!', '{ikon} New badge: {namn}!', '{ikon} Nowa odznaka: {namn}!'],
    'marke.forsta.namn': ['Första steget', 'First step', 'Pierwszy krok'],
    'marke.forsta.text': ['Klara din första lektion.', 'Complete your first lesson.', 'Ukończ swoją pierwszą lekcję.'],
    'marke.streak3.namn': ['Tre dagar i rad', 'Three days in a row', 'Trzy dni z rzędu'],
    'marke.streak3.text': ['Öva tre dagar i rad.', 'Practise three days in a row.', 'Ćwicz trzy dni z rzędu.'],
    'marke.streak7.namn': ['En hel vecka', 'A whole week', 'Cały tydzień'],
    'marke.streak7.text': ['Öva sju dagar i rad.', 'Practise seven days in a row.', 'Ćwicz siedem dni z rzędu.'],
    'marke.streak30.namn': ['Månadens hjälte', 'Hero of the month', 'Bohater miesiąca'],
    'marke.streak30.text': ['Öva 30 dagar i rad.', 'Practise 30 days in a row.', 'Ćwicz 30 dni z rzędu.'],
    'marke.xp100.namn': ['100 XP', '100 XP', '100 XP'],
    'marke.xp100.text': ['Samla 100 XP.', 'Collect 100 XP.', 'Zbierz 100 XP.'],
    'marke.xp500.namn': ['500 XP', '500 XP', '500 XP'],
    'marke.xp500.text': ['Samla 500 XP.', 'Collect 500 XP.', 'Zbierz 500 XP.'],
    'marke.xp2000.namn': ['2000 XP', '2000 XP', '2000 XP'],
    'marke.xp2000.text': ['Samla 2000 XP.', 'Collect 2000 XP.', 'Zbierz 2000 XP.'],
    'marke.felfri.namn': ['Felfri', 'Flawless', 'Bezbłędnie'],
    'marke.felfri.text': ['Klara en lektion utan ett enda fel.', 'Complete a lesson without a single mistake.', 'Ukończ lekcję bez ani jednego błędu.'],
    'marke.boss.namn': ['Bossbesegrare', 'Boss slayer', 'Pogromca bossów'],
    'marke.boss.text': ['Vinn en bosskamp.', 'Win a boss battle.', 'Wygraj walkę z bossem.'],
    'marke.niva.namn': ['{niva} klar', '{niva} complete', '{niva} ukończony'],
    'marke.niva.text': ['Klara hela nivå {niva} – {plats}.', 'Complete all of level {niva} – {plats}.', 'Ukończ cały poziom {niva} – {plats}.'],
    'marke.ord50.namn': ['Ordförråd 50', 'Vocabulary 50', 'Słownictwo 50'],
    'marke.ord50.text': ['Svara rätt på 50 olika ord.', 'Answer 50 different words correctly.', 'Odpowiedz poprawnie na 50 różnych słów.'],
    'marke.ord250.namn': ['Ordförråd 250', 'Vocabulary 250', 'Słownictwo 250'],
    'marke.ord250.text': ['Svara rätt på 250 olika ord.', 'Answer 250 different words correctly.', 'Odpowiedz poprawnie na 250 różnych słów.'],
    'marke.samlare.namn': ['Ordsamlare', 'Word collector', 'Kolekcjoner słów'],
    'marke.samlare.text': ['Lägg till 5 egna ord.', 'Add 5 words of your own.', 'Dodaj 5 własnych słów.'],
    'marke.uttal.namn': ['Rikssvenska', 'Standard Swedish', 'Wzorowy szwedzki'],
    'marke.uttal.text': ['Få minst 90 % i uttalskontrollen.', 'Score at least 90% in the pronunciation check.', 'Uzyskaj co najmniej 90% w sprawdzaniu wymowy.'],
    'marke.uggla.namn': ['Nattuggla', 'Night owl', 'Nocny marek'],
    'marke.uggla.text': ['Öva efter klockan 22.', 'Practise after 10 pm.', 'Ćwicz po 22:00.'],
    'marke.morgon.namn': ['Morgonpigg', 'Early bird', 'Ranny ptaszek'],
    'marke.morgon.text': ['Öva före klockan 7.', 'Practise before 7 am.', 'Ćwicz przed 7:00.'],

    // Toppraden
    'stat.streakKlar': ['Dagar i rad – dagens eld tänd!', 'Days in a row – today’s fire is lit!', 'Dni z rzędu – dzisiejszy ogień płonie!'],
    'stat.streakEj': ['Dagar i rad – klara en lektion i dag så håller elden i sig', 'Days in a row – complete a lesson today to keep the fire going', 'Dni z rzędu – ukończ dziś lekcję, aby ogień nie zgasł'],
    'stat.xp': ['Totalt XP', 'Total XP', 'Łącznie XP'],
    'stat.nyttHjarta': ['Nytt hjärta om {min} min', 'New heart in {min} min', 'Nowe serce za {min} min'],
    'stat.fullaHjartan': ['Fulla hjärtan', 'Full hearts', 'Pełne serca'],

    // Startsidan och kartan
    'hem.hej': ['Hej! Jag heter Bosse. Följ med genom Sverige och lär dig svenska!', 'Hej! I’m Bosse. Come along through Sweden and learn Swedish!', 'Hej! Jestem Bosse. Chodź ze mną przez Szwecję i ucz się szwedzkiego!'],
    'hem.valkommen': ['Välkommen tillbaka! Ska vi hålla elden vid liv i dag?', 'Welcome back! Shall we keep the fire alive today?', 'Witaj z powrotem! Utrzymamy dziś ogień przy życiu?'],
    'hem.malKlart': ['Dagens mål är klart – du är en stjärna! ⭐', 'Today’s goal is done – you’re a star! ⭐', 'Dzisiejszy cel osiągnięty – jesteś gwiazdą! ⭐'],
    'hem.bosseTitel': ['Tryck på Bosse för ett nytt tips', 'Tap Bosse for a new tip', 'Dotknij Bossego, aby dostać nową wskazówkę'],
    'hem.dagensMal': ['Dagens mål', 'Today’s goal', 'Cel na dziś'],
    'hem.xpAv': ['{xp} av {mal} XP', '{xp} of {mal} XP', '{xp} z {mal} XP'],
    'hem.fortsatt': ['▶ Fortsätt: {titel}', '▶ Continue: {titel}', '▶ Kontynuuj: {titel}'],
    'hem.repetera': ['🔁 Repetera', '🔁 Review', '🔁 Powtórka'],
    'hem.repInfo': ['Repetition kostar inga hjärtan och ger +1 ❤️', 'Review costs no hearts and gives +1 ❤️', 'Powtórka nie kosztuje serc i daje +1 ❤️'],
    'hem.ingenRost': [
      'Ingen svensk röst hittades i din webbläsare ännu. Uppläsningen kan låta konstig. Tips: Chrome och Edge har bra svenska röster, och i Android/Windows kan du installera svenska som talspråk.',
      'No Swedish voice was found in your browser yet. Read-aloud may sound odd. Tip: Chrome and Edge have good Swedish voices, and on Android/Windows you can install Swedish as a speech language.',
      'W Twojej przeglądarce nie znaleziono jeszcze szwedzkiego głosu. Odczyt może brzmieć dziwnie. Wskazówka: Chrome i Edge mają dobre szwedzkie głosy, a na Androidzie/Windowsie możesz zainstalować szwedzki jako język mowy.'],
    'hem.ingenUppl': ['Din webbläsare saknar uppläsning. Lyssna-övningarna byts mot vanliga övningar.', 'Your browser has no read-aloud. Listening exercises are replaced with regular ones.', 'Twoja przeglądarka nie ma odczytu na głos. Ćwiczenia ze słuchania zostaną zastąpione zwykłymi.'],
    'hem.resan': ['🗺️ Resan genom Sverige', '🗺️ The journey through Sweden', '🗺️ Podróż przez Szwecję'],
    'hem.resaInfo': ['{klara} av {alla} stopp klara · {ord} ord och fraser · nivå A1 → C2', '{klara} of {alla} stops done · {ord} words and phrases · level A1 → C2', 'Ukończone przystanki: {klara} z {alla} · słowa i zwroty: {ord} · poziom A1 → C2'],
    'hem.egnaOrd': ['✍️ Egna ord', '✍️ Your own words', '✍️ Własne słowa'],
    'karta.bosskamp': [' (bosskamp)', ' (boss battle)', ' (walka z bossem)'],
    'karta.last': [', låst', ', locked', ', zablokowane'],
    'karta.klarStj': [', klar med {n} stjärnor', ', done with {n} stars', ', ukończone, gwiazdki: {n}'],
    'karta.duArHar': ['Du är här!', 'You are here!', 'Jesteś tutaj!'],
    'karta.lektionerBoss': ['{namn} · {n} lektioner + bosskamp', '{namn} · {n} lessons + boss battle', '{namn} · lekcje: {n} + walka z bossem'],
    'karta.nivaKlar': ['Nivån klar', 'Level complete', 'Poziom ukończony'],
    'karta.hoppaTitel': ['Kan du redan det här? Vinn bosskampen på nivån innan så hoppar du hit.', 'Already know this? Win the boss battle of the level before to jump here.', 'Już to umiesz? Wygraj walkę z bossem na poprzednim poziomie, aby tu przeskoczyć.'],
    'karta.hoppa': ['🔑 Hoppa hit', '🔑 Jump here', '🔑 Przeskocz tutaj'],
    'nod.klar': [', klar', ', done', ', ukończone'],
    'nod.laggTill': ['Lägg till ord under ✍️', 'Add words under ✍️', 'Dodaj słowa w zakładce ✍️'],
    'nod.ingaOrd': ['Inga ord än', 'No words yet', 'Jeszcze brak słów'],

    // Profil
    'profil.rubrik': ['🏅 Profil', '🏅 Profile', '🏅 Profil'],
    'profil.dagar': ['dagar i rad', 'days in a row', 'dni z rzędu'],
    'profil.xp': ['XP totalt', 'XP in total', 'XP łącznie'],
    'profil.ordKan': ['ord kan du', 'words you know', 'znane słowa'],
    'profil.stopp': ['stopp klara', 'stops done', 'ukończone przystanki'],
    'profil.xpVeckaAria': ['XP per dag senaste veckan: {v}', 'XP per day over the last week: {v}', 'XP dziennie w ostatnim tygodniu: {v}'],
    'profil.xpVecka': ['XP senaste veckan', 'XP over the last week', 'XP w ostatnim tygodniu'],
    'profil.gronStapel': ['Grön stapel = dagsmålet ({mal} XP) klarat.', 'Green bar = daily goal ({mal} XP) reached.', 'Zielony słupek = cel dzienny ({mal} XP) osiągnięty.'],
    'profil.tog': ['Tog {datum}', 'Earned {datum}', 'Zdobyto {datum}'],
    'profil.marken': ['Märken ({n}/{alla})', 'Badges ({n}/{alla})', 'Odznaki ({n}/{alla})'],
    'profil.reskamrater': ['Dina reskamrater', 'Your travel companions', 'Twoi towarzysze podróży'],

    // Ordlista och ordkort
    'ordlista.rubrik': ['📖 Ordlista', '📖 Word list', '📖 Słownik'],
    'ordlista.sok': ['Sök på svenska, engelska eller polska…', 'Search in Swedish, English or Polish…', 'Szukaj po szwedzku, angielsku lub polsku…'],
    'ordlista.sokAria': ['Sök ord', 'Search words', 'Szukaj słów'],
    'ordlista.valjLektion': ['Välj lektion', 'Choose a lesson', 'Wybierz lekcję'],
    'ordlista.alla': ['Alla lektioner', 'All lessons', 'Wszystkie lekcje'],
    'ordkort.ovaUttal': ['🎙️ Öva uttalet', '🎙️ Practise pronunciation', '🎙️ Ćwicz wymowę'],
    'ordkort.ovaMening': ['Öva hela exempelmeningen', 'Practise the whole example sentence', 'Ćwicz całe przykładowe zdanie'],

    // Uttalspanelen
    'uttal.spelaIn': ['⏺ Spela in dig', '⏺ Record yourself', '⏺ Nagraj się'],
    'uttal.spelaInIgen': ['⏺ Spela in igen', '⏺ Record again', '⏺ Nagraj ponownie'],
    'uttal.stoppa': ['⏹ Stoppa', '⏹ Stop', '⏹ Zatrzymaj'],
    'uttal.jamfor': ['⇄ Jämför', '⇄ Compare', '⇄ Porównaj'],
    'uttal.lyssnaDig': ['Lyssna på dig själv och jämför med förlagan.', 'Listen to yourself and compare with the model.', 'Posłuchaj siebie i porównaj z wzorem.'],
    'uttal.spelarIn': ['Spelar in… säg ordet och tryck Stoppa.', 'Recording… say the word and press Stop.', 'Nagrywanie… powiedz słowo i naciśnij Zatrzymaj.'],
    'uttal.forlagan': ['Förlagan…', 'The model…', 'Wzór…'],
    'uttal.du': ['Du…', 'You…', 'Ty…'],
    'uttal.latDet': ['Lät det likadant? Spela in igen tills du är nöjd.', 'Did it sound the same? Record again until you are happy.', 'Brzmiało tak samo? Nagrywaj ponownie, aż efekt Cię zadowoli.'],
    'uttal.hurLat': ['Hur lät det?', 'How did it sound?', 'Jak to brzmiało?'],
    'uttal.latRatt': ['👍 Det lät rätt', '👍 It sounded right', '👍 Brzmiało dobrze'],
    'uttal.ovaMer': ['🤔 Öva mer', '🤔 Practise more', '🤔 Ćwicz dalej'],
    'uttal.forlaga': ['🔊 Förlaga', '🔊 Model', '🔊 Wzór'],
    'uttal.langsamt': ['🐢 Långsamt', '🐢 Slowly', '🐢 Powoli'],
    'uttal.ingenInspelning': ['Inspelning stöds inte i den här webbläsaren (eller sidan är inte https).', 'Recording is not supported in this browser (or the page is not https).', 'Nagrywanie nie jest obsługiwane w tej przeglądarce (lub strona nie używa https).'],
    'uttal.kontroll': ['🎤 Uttalskontroll', '🎤 Pronunciation check', '🎤 Sprawdź wymowę'],
    'uttal.lyssnar': ['🎤 Lyssnar… säg: {text}', '🎤 Listening… say: {text}', '🎤 Słucham… powiedz: {text}'],
    'uttal.utmarkt': ['Utmärkt! 🎉', 'Excellent! 🎉', 'Doskonale! 🎉'],
    'uttal.nastan': ['Nästan! Försök igen.', 'Almost! Try again.', 'Prawie! Spróbuj ponownie.'],
    'uttal.inteRiktigt': ['Inte riktigt – lyssna på förlagan och prova igen.', 'Not quite – listen to the model and try again.', 'Nie całkiem – posłuchaj wzoru i spróbuj ponownie.'],
    'uttal.hordes': ['Jag hörde: "{text}" · {procent}% · {dom}', 'I heard: "{text}" · {procent}% · {dom}', 'Usłyszałem: „{text}” · {procent}% · {dom}'],
    'uttal.ingenKontroll': [
      'Automatisk uttalskontroll finns inte i den här webbläsaren (fungerar i Chrome och Edge). Spela in dig själv och jämför med örat i stället.',
      'Automatic pronunciation check is not available in this browser (it works in Chrome and Edge). Record yourself and compare by ear instead.',
      'Automatyczne sprawdzanie wymowy nie jest dostępne w tej przeglądarce (działa w Chrome i Edge). Zamiast tego nagraj się i porównaj ze słuchu.'],

    // Mina ord
    'mina.rubrik': ['✍️ Mina ord', '✍️ My words', '✍️ Moje słowa'],
    'mina.info': ['Orden sparas i din webbläsare och dyker direkt upp i lektionen "Mina ord".', 'The words are saved in your browser and show up right away in the “My words” lesson.', 'Słowa zapisują się w Twojej przeglądarce i od razu pojawiają się w lekcji „Moje słowa”.'],
    'mina.laggTillRubrik': ['Lägg till ett ord', 'Add a word', 'Dodaj słowo'],
    'mina.svenska': ['Svenska *', 'Swedish *', 'Szwedzki *'],
    'mina.engelska': ['Engelska *', 'English *', 'Angielski *'],
    'mina.polska': ['Polska *', 'Polish *', 'Polski *'],
    'mina.ordklass': ['Ordklass', 'Part of speech', 'Część mowy'],
    'mina.niva': ['Nivå', 'Level', 'Poziom'],
    'mina.exempel': ['Exempelmening (valfritt)', 'Example sentence (optional)', 'Przykładowe zdanie (opcjonalnie)'],
    'mina.exSv': ['Mening på svenska', 'Sentence in Swedish', 'Zdanie po szwedzku'],
    'mina.exEn': ['På engelska', 'In English', 'Po angielsku'],
    'mina.exPl': ['På polska', 'In Polish', 'Po polsku'],
    'mina.laggTill': ['➕ Lägg till', '➕ Add', '➕ Dodaj'],
    'mina.tillagt': ['"{sv}" är tillagt! 🎉', '“{sv}” has been added! 🎉', '„{sv}” zostało dodane! 🎉'],
    'mina.inga': ['Inga egna ord än.', 'No words of your own yet.', 'Jeszcze brak własnych słów.'],
    'mina.taBort': ['Ta bort {sv}', 'Remove {sv}', 'Usuń {sv}'],
    'mina.taBortFraga': ['Ta bort "{sv}"?', 'Remove “{sv}”?', 'Usunąć „{sv}”?'],
    'mina.dina': ['Dina ord', 'Your words', 'Twoje słowa'],
    'mina.ova': ['▶ Öva mina ord', '▶ Practise my words', '▶ Ćwicz moje słowa'],
    'mina.forStor': ['Filen är för stor (max 2 MB).', 'The file is too large (max 2 MB).', 'Plik jest za duży (maks. 2 MB).'],
    'mina.ingenLista': ['Hittade ingen ordlista i filen.', 'No word list was found in the file.', 'Nie znaleziono listy słów w pliku.'],
    'mina.importerade': ['Importerade {n} ord', 'Imported {n} words', 'Zaimportowane słowa: {n}'],
    'mina.hoppade': [', hoppade över {n} (dubbletter eller ogiltiga)', ', skipped {n} (duplicates or invalid)', ', pominięte: {n} (duplikaty lub nieprawidłowe)'],
    'mina.importFel': ['Importen misslyckades: {fel}', 'Import failed: {fel}', 'Import nie powiódł się: {fel}'],
    'mina.exportRubrik': ['Export och import', 'Export and import', 'Eksport i import'],
    'mina.exportInfo': ['Spara dina ord som en JSON-fil eller läs in en fil från en annan enhet.', 'Save your words as a JSON file or load a file from another device.', 'Zapisz swoje słowa jako plik JSON lub wczytaj plik z innego urządzenia.'],
    'mina.exportera': ['⬇️ Exportera JSON', '⬇️ Export JSON', '⬇️ Eksportuj JSON'],
    'mina.importera': ['⬆️ Importera JSON', '⬆️ Import JSON', '⬆️ Importuj JSON'],
    'mina.exportFel': ['Exporten misslyckades: {fel}', 'Export failed: {fel}', 'Eksport nie powiódł się: {fel}'],
    'val.fyllI': ['Fyll i svenska, engelska och polska.', 'Fill in Swedish, English and Polish.', 'Wypełnij pola: szwedzki, angielski i polski.'],
    'val.forLangt': ['Det svenska ordet är för långt (max 60 tecken).', 'The Swedish word is too long (max 60 characters).', 'Szwedzkie słowo jest za długie (maks. 60 znaków).'],
    'val.tecken': ['Tecknen < och > är inte tillåtna.', 'The characters < and > are not allowed.', 'Znaki < i > są niedozwolone.'],
    'val.textForLang': ['En av texterna är för lång (max 200 tecken).', 'One of the texts is too long (max 200 characters).', 'Jeden z tekstów jest za długi (maks. 200 znaków).'],
    'val.finns': ['"{sv}" finns redan i ordlistan.', '“{sv}” is already in the word list.', '„{sv}” jest już w słowniku.'],

    // Spara till GitHub
    'gh.repoFormat': ['Repot ska skrivas som ägare/namn.', 'Write the repo as owner/name.', 'Wpisz repozytorium jako właściciel/nazwa.'],
    'gh.ejToken': ['Det ser inte ut som en GitHub-token.', 'That doesn’t look like a GitHub token.', 'To nie wygląda na token GitHub.'],
    'gh.ingaOrd': ['Du har inga egna ord att spara.', 'You have no words of your own to save.', 'Nie masz własnych słów do zapisania.'],
    'gh.hamtar': ['Hämtar words.json från GitHub…', 'Fetching words.json from GitHub…', 'Pobieranie words.json z GitHuba…'],
    'gh.401': ['Token godtogs inte (401). Kontrollera den.', 'The token was not accepted (401). Check it.', 'Token nie został zaakceptowany (401). Sprawdź go.'],
    'gh.404': ['Hittade inte repot eller words.json (404). Har token åtkomst till repot?', 'Could not find the repo or words.json (404). Does the token have access to the repo?', 'Nie znaleziono repozytorium ani words.json (404). Czy token ma dostęp do repozytorium?'],
    'gh.svarade': ['GitHub svarade {status}', 'GitHub responded {status}', 'GitHub odpowiedział {status}'],
    'gh.felFormat': ['words.json på GitHub har fel format.', 'words.json on GitHub has the wrong format.', 'words.json na GitHubie ma nieprawidłowy format.'],
    'gh.sparar': ['Sparar {n} ord…', 'Saving {n} words…', 'Zapisywanie słów: {n}…'],
    'gh.igen': ['Filen ändrades samtidigt – försöker igen…', 'The file changed at the same time – trying again…', 'Plik zmienił się w tym samym czasie – próbuję ponownie…'],
    'gh.skrivratt': ['Token saknar skrivrätt (Contents: Read and write) till repot.', 'The token lacks write access (Contents: Read and write) to the repo.', 'Token nie ma prawa zapisu (Contents: Read and write) w repozytorium.'],
    'gh.svaradeSpara': ['GitHub svarade {status} när filen skulle sparas.', 'GitHub responded {status} when saving the file.', 'GitHub odpowiedział {status} podczas zapisywania pliku.'],
    'gh.tvaForsok': ['Kunde inte spara efter två försök.', 'Could not save after two attempts.', 'Nie udało się zapisać po dwóch próbach.'],
    'gh.sparadHar': ['•••• sparad i den här webbläsaren', '•••• saved in this browser', '•••• zapisany w tej przeglądarce'],
    'gh.knapp': ['☁️ Spara mina ord till GitHub', '☁️ Save my words to GitHub', '☁️ Zapisz moje słowa na GitHubie'],
    'gh.klistra': ['Klistra in en token först.', 'Paste a token first.', 'Najpierw wklej token.'],
    'gh.klart': ['Klart! {n} ord committade till words.json. Sajten uppdateras om ungefär en minut.', 'Done! {n} words committed to words.json. The site updates in about a minute.', 'Gotowe! Słowa ({n}) zapisane w words.json. Strona zaktualizuje się za około minutę.'],
    'gh.allaFinns': ['Alla dina ord finns redan i words.json – inget att spara.', 'All your words are already in words.json – nothing to save.', 'Wszystkie Twoje słowa są już w words.json – nie ma nic do zapisania.'],
    'gh.rubrik': ['☁️ Spara till GitHub (valfritt)', '☁️ Save to GitHub (optional)', '☁️ Zapisz na GitHubie (opcjonalnie)'],
    'gh.info1': ['Lägger in dina ord i den delade ordlistan (lektionen "Tillagda ord") så att alla ser dem. Skapa en ', 'Adds your words to the shared word list (the “Added words” lesson) so everyone can see them. Create a ', 'Dodaje Twoje słowa do wspólnego słownika (lekcja „Dodane słowa”), aby wszyscy je widzieli. Utwórz '],
    'gh.info2': [' med bara "Contents: Read and write" för det här repot. Token sparas bara i den här webbläsaren och skickas bara till api.github.com – aldrig till repot.', ' with only “Contents: Read and write” for this repo. The token is stored only in this browser and is sent only to api.github.com – never to the repo.', ' z uprawnieniem tylko „Contents: Read and write” dla tego repozytorium. Token jest przechowywany tylko w tej przeglądarce i wysyłany tylko do api.github.com – nigdy do repozytorium.'],
    'gh.repo': ['Repo', 'Repo', 'Repozytorium'],
    'gh.token': ['Token', 'Token', 'Token'],
    'gh.tokenAria': ['GitHub-token', 'GitHub token', 'Token GitHub'],
    'gh.glom': ['🧹 Glöm token', '🧹 Forget token', '🧹 Zapomnij token'],
    'gh.borttagen': ['Token borttagen från webbläsaren.', 'Token removed from the browser.', 'Token usunięty z przeglądarki.'],

    // Inställningar
    'inst.rubrik': ['⚙️ Inställningar', '⚙️ Settings', '⚙️ Ustawienia'],
    'inst.sidansSprak': ['Sidans språk', 'Page language', 'Język strony'],
    'inst.sprakInfo': ['Orden du lär dig är alltid svenska. Översättningarna visas på engelska och polska.', 'The words you learn are always Swedish. Translations are shown in English.', 'Słowa, których się uczysz, są zawsze szwedzkie. Tłumaczenia pokazujemy po polsku.'],
    'inst.oversattTill': ['Översätt till', 'Translate to', 'Tłumacz na'],
    'inst.oversAria': ['Översättningsspråk i övningarna', 'Translation language in exercises', 'Język tłumaczeń w ćwiczeniach'],
    'inst.uppl': ['Uppläsning', 'Read-aloud', 'Odczyt na głos'],
    'inst.svenskRost': ['Svensk röst', 'Swedish voice', 'Szwedzki głos'],
    'inst.ingenRost': ['Ingen svensk röst hittad', 'No Swedish voice found', 'Nie znaleziono szwedzkiego głosu'],
    'inst.hastighet': ['Hastighet', 'Speed', 'Szybkość'],
    'inst.talhastighet': ['Talhastighet', 'Speech rate', 'Szybkość mowy'],
    'inst.testa': ['🔊 Testa rösten', '🔊 Test the voice', '🔊 Przetestuj głos'],
    'inst.autoljud': ['Läs upp orden automatiskt i övningarna', 'Read words aloud automatically in exercises', 'Automatycznie odczytuj słowa w ćwiczeniach'],
    'inst.uttal': ['Ta med uttalsövningar (mikrofon)', 'Include pronunciation exercises (microphone)', 'Uwzględniaj ćwiczenia wymowy (mikrofon)'],
    'inst.ljud': ['Ljudeffekter (pip vid rätt och fel)', 'Sound effects (beeps for right and wrong)', 'Efekty dźwiękowe (sygnał przy dobrej i złej odpowiedzi)'],
    'inst.dagsmal': ['Dagsmål', 'Daily goal', 'Cel dzienny'],
    'inst.mal10': ['Lugnt – 10 XP', 'Relaxed – 10 XP', 'Spokojnie – 10 XP'],
    'inst.mal30': ['Vanligt – 30 XP', 'Regular – 30 XP', 'Normalnie – 30 XP'],
    'inst.mal60': ['Seriöst – 60 XP', 'Serious – 60 XP', 'Poważnie – 60 XP'],
    'inst.mal100': ['Intensivt – 100 XP', 'Intense – 100 XP', 'Intensywnie – 100 XP'],
    'inst.framsteg': ['Framsteg', 'Progress', 'Postępy'],
    'inst.sparasBara': ['Allt sparas bara i den här webbläsaren.', 'Everything is saved only in this browser.', 'Wszystko zapisuje się tylko w tej przeglądarce.'],
    'inst.nollstallFraga': ['Nollställa XP, streak och alla lektioner? Dina egna ord behålls.', 'Reset XP, streak and all lessons? Your own words are kept.', 'Wyzerować XP, serię i wszystkie lekcje? Twoje własne słowa zostaną zachowane.'],
    'inst.nollstall': ['♻️ Nollställ framsteg', '♻️ Reset progress', '♻️ Wyzeruj postępy'],
    'inst.fot': ['Svenska Ord · fri och reklamfri · ', 'Svenska Ord · free and ad-free · ', 'Svenska Ord · za darmo i bez reklam · '],
    'inst.kallkod': ['källkod på GitHub', 'source code on GitHub', 'kod źródłowy na GitHubie'],

    // Lektionerna
    'lektion.ingaOrd': ['Lektionen har inga ord än.', 'The lesson has no words yet.', 'Ta lekcja nie ma jeszcze słów.'],
    'lektion.avsluta': ['Avsluta lektionen', 'Quit the lesson', 'Zakończ lekcję'],
    'lektion.avslutaFraga': ['Avsluta lektionen? Framstegen i den här lektionen försvinner.', 'Quit the lesson? Progress in this lesson will be lost.', 'Zakończyć lekcję? Postępy w tej lekcji zostaną utracone.'],
    'lektion.bosskamp': ['Bosskamp', 'Boss battle', 'Walka z bossem'],
    'rep.titel': ['Repetition', 'Review', 'Powtórka'],
    'hjartan.slut': ['Slut på hjärtan', 'Out of hearts', 'Brak serc'],
    'hjartan.info': ['Nästa hjärta kommer om {min} min. Gör en repetition så får du ett hjärta direkt – den kostar inga hjärtan.', 'The next heart arrives in {min} min. Do a review to get a heart right away – it costs no hearts.', 'Następne serce pojawi się za {min} min. Zrób powtórkę, a od razu dostaniesz serce – powtórka nie kosztuje serc.'],
    'hjartan.repNu': ['🔁 Repetera nu', '🔁 Review now', '🔁 Powtórz teraz'],
    'hjartan.senare': ['Senare', 'Later', 'Później'],
    'ov.kontrollera': ['Kontrollera', 'Check', 'Sprawdź'],
    'ov.hoppaOver': ['Hoppa över', 'Skip', 'Pomiń'],
    'ov.nyttOrd': ['✨ Nytt ord', '✨ New word', '✨ Nowe słowo'],
    'ov.harKoll': ['Jag har koll – fortsätt', 'Got it – continue', 'Jasne – dalej'],
    'ov.betyder.en': ['Vad betyder ordet på engelska?', 'What does the word mean in English?', 'Co znaczy to słowo po angielsku?'],
    'ov.betyder.pl': ['Vad betyder ordet på polska?', 'What does the word mean in Polish?', 'Co znaczy to słowo po polsku?'],
    'ov.valjSvenska': ['Välj det svenska ordet', 'Choose the Swedish word', 'Wybierz szwedzkie słowo'],
    'ov.lyssnaValj': ['Lyssna och välj ordet du hör', 'Listen and choose the word you hear', 'Posłuchaj i wybierz słowo, które słyszysz'],
    'ov.spelaIgen': ['Spela upp igen', 'Play again', 'Odtwórz ponownie'],
    'ov.spelaLangsamt': ['Spela upp långsamt', 'Play slowly', 'Odtwórz powoli'],
    'ov.prickarna': ['Tänk på prickarna: {mal}', 'Mind the dots: {mal}', 'Uważaj na kropki: {mal}'],
    'ov.stavfel': ['Stavfel – det heter {mal}', 'Typo – it’s spelled {mal}', 'Literówka – poprawnie: {mal}'],
    'ov.skriv': ['Skriv ordet på svenska', 'Write the word in Swedish', 'Napisz to słowo po szwedzku'],
    'ov.skrivHar': ['Skriv på svenska…', 'Type in Swedish…', 'Pisz po szwedzku…'],
    'ov.dittSvar': ['Ditt svar', 'Your answer', 'Twoja odpowiedź'],
    'ov.lucka': ['Fyll i det som saknas', 'Fill in the missing word', 'Uzupełnij brakujące słowo'],
    'ov.para': ['Para ihop orden', 'Match the words', 'Połącz słowa w pary'],
    'ov.paraInfo': ['Tryck på ett svenskt ord och sedan på översättningen.', 'Tap a Swedish word and then its translation.', 'Dotknij szwedzkiego słowa, a potem jego tłumaczenia.'],
    'ov.klart': ['Klart!', 'Done!', 'Gotowe!'],
    'ov.perfekt': ['Perfekt! 🎉', 'Perfect! 🎉', 'Perfekcyjnie! 🎉'],
    'ov.sagHogt': ['Säg ordet högt', 'Say the word out loud', 'Powiedz to słowo na głos'],
    'fb.annanGang': ['Vi tar det en annan gång!', 'We’ll do it another time!', 'Zrobimy to innym razem!'],
    'fb.combo': ['{n} i rad! 🔥 Bonus-XP!', '{n} in a row! 🔥 Bonus XP!', '{n} z rzędu! 🔥 Bonus XP!'],
    'fb.overhoppad': ['Överhoppad', 'Skipped', 'Pominięte'],
    'fb.nastanRatt': ['Nästan rätt! ✔', 'Almost right! ✔', 'Prawie dobrze! ✔'],
    'fb.ratt': ['Rätt! 🎉', 'Correct! 🎉', 'Dobrze! 🎉'],
    'fb.inteRiktigt': ['Inte riktigt', 'Not quite', 'Nie całkiem'],
    'fb.rattSvar': ['Rätt svar: ', 'Correct answer: ', 'Poprawna odpowiedź: '],
    'res.nastan': ['Nästan!', 'Almost!', 'Prawie!'],
    'res.hoppMiss': ['Du fick {p} %. Det krävs 80 % för att hoppa. Gå stigen eller försök igen – du är nära!', 'You got {p}%. You need 80% to jump ahead. Follow the path or try again – you’re close!', 'Wynik: {p}%. Aby przeskoczyć, potrzeba 80%. Idź ścieżką albo spróbuj ponownie – jesteś blisko!'],
    'res.ingenFara': ['Ingen fara! Gör en repetition (kostar inga hjärtan) eller vänta en stund – ett nytt hjärta kommer var 20:e minut.', 'No worries! Do a review (costs no hearts) or wait a while – a new heart arrives every 20 minutes.', 'Nic nie szkodzi! Zrób powtórkę (nie kosztuje serc) albo chwilę poczekaj – nowe serce pojawia się co 20 minut.'],
    'res.boss': ['Bossen besegrad! 🏰', 'Boss defeated! 🏰', 'Boss pokonany! 🏰'],
    'res.fantastiskt': ['Fantastiskt!', 'Fantastic!', 'Fantastycznie!'],
    'res.braJobbat': ['Bra jobbat!', 'Well done!', 'Dobra robota!'],
    'res.klartOva': ['Klart – öva mer så sitter det!', 'Done – practise more and it will stick!', 'Gotowe – ćwicz dalej, a zapamiętasz!'],
    'res.hoppade': ['Wow, du hoppade fram! Nästa del av kartan är öppen.', 'Wow, you jumped ahead! The next part of the map is open.', 'Wow, udało się przeskoczyć! Następna część mapy jest otwarta.'],
    'res.upplast': ['Nästa del av kartan är upplåst – vilken resa!', 'The next part of the map is unlocked – what a journey!', 'Następna część mapy jest odblokowana – co za podróż!'],
    'res.elden': [
      { one: 'Elden brinner – {n} dag i rad! 🔥', other: 'Elden brinner – {n} dagar i rad! 🔥' },
      { one: 'The fire is burning – {n} day in a row! 🔥', other: 'The fire is burning – {n} days in a row! 🔥' },
      { one: 'Ogień płonie – {n} dzień z rzędu! 🔥', few: 'Ogień płonie – {n} dni z rzędu! 🔥', many: 'Ogień płonie – {n} dni z rzędu! 🔥', other: 'Ogień płonie – {n} dnia z rzędu! 🔥' }],
    'res.malKlart': ['Dagens mål klart! Du är en stjärna! ⭐', 'Today’s goal done! You’re a star! ⭐', 'Cel na dziś osiągnięty! Jesteś gwiazdą! ⭐'],
    'res.iRad': ['{n} rätt i rad – imponerande!', '{n} correct in a row – impressive!', '{n} poprawnych z rzędu – imponujące!'],
    'res.snyggt': ['Snyggt jobbat! Ska vi ta en till?', 'Nice work! Shall we do another one?', 'Świetna robota! Robimy jeszcze jedną?'],
    'res.xp': ['XP', 'XP', 'XP'],
    'res.traff': ['Träffsäkerhet', 'Accuracy', 'Trafność'],
    'res.streak': ['Streak', 'Streak', 'Seria'],
    'res.nyaMarken': ['Nya märken!', 'New badges!', 'Nowe odznaki!']
  };

  // ---------------- Motor ----------------
  function lasSparat() { try { return window.localStorage.getItem(NYCKEL); } catch (e) { return null; } }
  function skrivSparat(v) { try { window.localStorage.setItem(NYCKEL, v); } catch (e) { /* privat läge: valet glöms vid omladdning */ } }

  /** Första gången: gissa från webbläsarens språk (pl → polska, sv → svenska, annars engelska). */
  function gissa() {
    let lista = [];
    try { lista = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']); } catch (e) { lista = []; }
    for (const l of lista) {
      const k = String(l || '').toLowerCase();
      if (k.startsWith('pl')) return 'pl';
      if (k.startsWith('sv')) return 'sv';
      if (k.startsWith('en')) return 'en';
    }
    return 'en';
  }

  const arWebblasare = typeof window !== 'undefined' && typeof document !== 'undefined';
  let aktuellt = 'sv';
  if (arWebblasare) {
    const sparat = lasSparat();
    aktuellt = SPRAK.includes(sparat) ? sparat : gissa();
  }
  const lyssnare = [];
  const saknade = new Set();

  function varde(nyckel, sprak = aktuellt) {
    const post = ORDBOK[nyckel];
    if (!post) { saknade.add(nyckel); return undefined; }
    const i = SPRAK.indexOf(sprak);
    const v = post[i];
    if (v === undefined || v === null || v === '') { saknade.add(sprak + ':' + nyckel); return post[0]; }
    return v;
  }

  function fyll(text, vars) {
    if (!vars) return text;
    return String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
  }

  function pluralForm(v, n) {
    let form = 'other';
    try { form = new Intl.PluralRules(aktuellt).select(Number(n)); } catch (e) { form = Number(n) === 1 ? 'one' : 'other'; }
    return v[form] !== undefined ? v[form] : v.other;
  }

  /** t('nyckel', {namn: 'x'}) – text på valt språk. Saknad nyckel ger nyckeln själv (och registreras). */
  function t(nyckel, vars) {
    const v = varde(nyckel);
    if (v === undefined) return nyckel;
    if (Array.isArray(v)) return v.join(' ');
    if (typeof v === 'object') return fyll(pluralForm(v, vars && vars.n), vars);
    return fyll(v, vars);
  }
  /** Listor (tips, beröm …) på valt språk. */
  function lista(nyckel) { const v = varde(nyckel); return Array.isArray(v) ? v : []; }
  /** Finns nyckeln? */
  function har(nyckel) { return Object.prototype.hasOwnProperty.call(ORDBOK, nyckel); }

  /** Översätter statisk HTML: data-i18n (text) och data-i18n-aria-label, data-i18n-content … (attribut). */
  function oversattDom(rotEl) {
    const bas = rotEl || document;
    bas.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    bas.querySelectorAll('*').forEach(el => {
      for (const a of Array.from(el.attributes)) {
        if (a.name.startsWith('data-i18n-')) el.setAttribute(a.name.slice(10), t(a.value));
      }
    });
  }

  function uppdateraKnappar() {
    document.querySelectorAll('.sprakval button[data-sprak]').forEach(b => {
      const pa = b.dataset.sprak === aktuellt;
      b.setAttribute('aria-pressed', String(pa));
      b.classList.toggle('vald', pa);
    });
    document.querySelectorAll('.sprakval').forEach(g => g.setAttribute('aria-label', t('sprak.aria')));
  }

  function tillampa() {
    document.documentElement.lang = aktuellt;
    document.title = t('sida.titel');
    oversattDom(document);
    uppdateraKnappar();
  }

  function setSprak(s, { tyst = false } = {}) {
    if (!SPRAK.includes(s)) return;
    const byte = s !== aktuellt;
    aktuellt = s;
    skrivSparat(s);
    tillampa();
    if (byte && !tyst) lyssnare.slice().forEach(f => { try { f(s); } catch (e) { console.error('Språkbyte:', e); } });
  }

  /** Segmenterad knapp SV | EN | PL. Skapas på nytt där den behövs (toppraden, lektionen, inställningarna). */
  function knapp({ klass = '' } = {}) {
    const grupp = document.createElement('div');
    grupp.className = 'sprakval' + (klass ? ' ' + klass : '');
    grupp.setAttribute('role', 'group');
    grupp.setAttribute('aria-label', t('sprak.aria'));
    for (const s of SPRAK) {
      const info = SPRAK_INFO[s];
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.sprak = s;
      b.lang = s;
      b.title = info.namn;
      b.setAttribute('aria-label', info.namn);
      b.setAttribute('aria-pressed', String(s === aktuellt));
      if (s === aktuellt) b.classList.add('vald');
      // Flaggan ritas med CSS (emoji-flaggor blir bara bokstäver i Windows).
      const flagga = document.createElement('span');
      flagga.className = 'sprak-flagga flagga-' + s;
      flagga.setAttribute('aria-hidden', 'true');
      const kod = document.createElement('span');
      kod.className = 'sprak-kod';
      kod.setAttribute('aria-hidden', 'true');
      kod.textContent = info.kod;
      const namn = document.createElement('span');
      namn.className = 'sprak-namn';
      namn.setAttribute('aria-hidden', 'true');
      namn.textContent = info.namn;
      b.append(flagga, kod, namn);
      b.addEventListener('click', () => setSprak(s));
      grupp.appendChild(b);
    }
    return grupp;
  }

  const I18n = {
    SPRAK, SPRAK_INFO, ORDBOK,
    get sprak() { return aktuellt; },
    t, lista, har, setSprak, knapp, tillampa, oversattDom,
    /** Vilka översättningar av ett ord som visas: engelska → ['en'], polska → ['pl'], svenska → båda. */
    visadeSprak() { return aktuellt === 'en' ? ['en'] : aktuellt === 'pl' ? ['pl'] : ['en', 'pl']; },
    narSprakAndras(f) { lyssnare.push(f); },
    get saknade() { return Array.from(saknade); },
    rensaSaknade() { saknade.clear(); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = I18n;
  if (arWebblasare) {
    rot.I18n = I18n;
    document.documentElement.lang = aktuellt;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tillampa); else tillampa();
  }
})(typeof window !== 'undefined' ? window : globalThis);
