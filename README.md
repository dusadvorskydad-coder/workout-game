# Workout hřiště

Hra, která má dostat lidi cvičit ven. Místo pokéstopů jsou na mapě workoutová
hřiště, každé má výzvy se stopkami a měsíční žebříček. Vítěze sezóny čeká odměna.

Prototyp je zatím pro **Nymburk a okolí**.

## Co už funguje

- mapa hřišť z OpenStreetMap a seznam seřazený podle vzdálenosti
- detail hřiště s vybavením a výzvami
- check-in podle GPS: výsledek uložený přímo na hřišti je označený jako ověřený
- pět výzev (shyby, kliky, dipy, vis, Stovka na čas) s pravidly a návodem ke cvikům
- stopky a zápis výsledku
- žebříček každé výzvy na každém hřišti, sezóna je kalendářní měsíc

Bez nastavení se výsledky ukládají **jen v zařízení**. Společný žebříček se
zapne připojením k Supabase (viz níže).

## Společný žebříček (Supabase)

1. Na [supabase.com](https://supabase.com) založ bezplatný projekt (region Frankfurt).
2. V **SQL Editoru** spusť celý soubor `supabase/schema.sql`.
3. V **Authentication → Sign In / Providers** zapni **Allow anonymous sign-ins**.
4. Do souboru `.env` doplň adresu projektu a veřejný klíč
   (**Project Settings → API Keys**, klíč *publishable*, dříve *anon*).
   Tajný klíč (*secret* / *service_role*) do aplikace nepatří.
5. Aplikaci spusť znovu.

Hráč se nepřihlašuje e-mailem: při prvním uložení výsledku se mu založí anonymní
účet svázaný se zařízením a zvolená přezdívka se mu zarezervuje.

## Spuštění

```bash
npm install
npm run web        # v prohlížeči
npm start          # na telefonu přes aplikaci Expo Go (naskenuj QR kód)
```

Kontrola typů: `npm run typecheck`

## Zveřejnění webu

Po každém nahrání změn sestaví GitHub Actions webovou verzi a uloží ji do větve
`gh-pages` (viz `.github/workflows/web.yml`). GitHub Pages ji pak zveřejní na
<https://dusadvorskydad-coder.github.io/workout-game/>.

## Data o hřištích

Hřiště jsou v `src/data/spots.json`. Soubor vytváří skript, který stáhne cvičební
prvky z OpenStreetMap (`leisure=fitness_station`) a prvky do 250 m od sebe spojí
do jednoho hřiště:

```bash
npm run spots                         # Nymburk, 12 km okolo
npm run spots -- 50.0755 14.4378 8000 # jiné místo: šířka, délka, poloměr v metrech
```

Chybí-li některé hřiště, dá se doplnit přímo na [openstreetmap.org](https://www.openstreetmap.org)
a skript pustit znovu.

## Struktura

- `App.tsx` – přepínání obrazovek
- `src/screens` – mapa, detail hřiště, výzva
- `src/components` – mapa (`SpotMap.tsx` pro telefon, `SpotMap.web.tsx` pro web), stopky
- `src/data/challenges.ts` – výzvy a návody ke cvikům
- `src/lib/results.ts` – ukládání výsledků a výpočet žebříčku
- `src/lib/backend.ts` – připojení k Supabase
- `supabase/schema.sql` – tabulky a pravidla přístupu
