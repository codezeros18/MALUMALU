# Paspor Petani Mobile — Design Spec

**Date:** 2026-07-16
**Status:** Approved by Kenny
**Deadline:** Hackathon demo in < 12 hours
**Source blueprint:** https://github.com/codezeros18/MALUMALU (planning/prompt pack for the website "Paspor Petani v2")

---

## 1. Goal

A native Android app (Expo / React Native, demoed via Expo Go) that runs the same 6-step
killer demo as the planned MALUMALU website, fully offline:

1. Register farmer (petani)
2. Tag plot — map tap or GPS capture
3. Offline deforestation check (point-in-raster over Pangalengan)
4. Tiered farmer data card (Lokal / Export-Ready) with reasons
5. Tamper-evident hash-chain — "simulasi ubah data" visibly breaks the chain (money moment)
6. Consent panel + unauthorized-access notification + manual override

UI language: Indonesian. Primary demo device: Android phone running Expo Go.
APK build (EAS) only if time remains.

## 2. Scope

**In:** everything in the 6-step flow above, demo data seeding, offline operation,
"Paspor" theme (section 6), honest accuracy disclosures.

**Out (never build):** backend/server, real JRC raster preprocessing (demo raster
in the same format instead — real file swaps in later), PDF export, multi-plot
management, dashboards, multi-language, blockchain, precise polygons, iOS testing.

**Cut order if time runs out (bottom of build order first, never the top):**
consent/notif → map (fall back to GPS-only + manual coordinate entry) → polish.
Card + hash-chain are never cut.

## 3. Architecture

- **Stack:** Expo (managed), TypeScript, expo-router (bottom tabs).
- **Structure mirrors the website blueprint** so pure logic files can be copied
  between the two projects in either direction:

```
app/                     # expo-router screens (tabs) — at repo root per expo-router convention
src/
├── types/index.ts       # same type contracts as website blueprint
├── lib/
│   ├── db.ts            # AsyncStorage repository: addPetani, addPlot, addKartu, ...
│   ├── ruleEngine.ts    # DeforestasiCheck + data completeness → Tier + StdbStatus + reasons
│   ├── hashchain.ts     # SHA-256 chain via expo-crypto
│   ├── geospatial.ts    # cekDeforestasi: point-in-raster lookup
│   └── gps.ts           # expo-location wrapper (position + accuracy)
├── components/          # KartuCard, HashChainViewer, ConsentPanel, NotifBanner, MapPicker, ...
├── data/
│   ├── dummyData.ts     # 3 demo farmers w/ plots in Pangalengan bbox, labeled DATA DEMO
│   └── pangalengan.json # demo risk raster, same format the AI engineer will produce
└── theme/               # tokens: colors, typography, spacing
```

- **Storage:** AsyncStorage behind `lib/db.ts` (collections: Petani, Plot, Kartu,
  HashChainEntry, ConsentRecord, AccessLog, NotifItem). Async + try/catch everywhere.
- **Hash-chain:** SHA-256 via `js-sha256` (pure JS: synchronous + Jest-testable,
  no native module — revised from expo-crypto during planning). Entry shape:
  `{ index, timestamp, dataHash, previousHash, hash }`. Viewer verifies the full chain
  and renders green "Rantai utuh" / red "Rantai rusak di entri #X".
- **Geospatial:** bundled `pangalengan.json` grid raster over the Pangalengan bbox
  (center lat -7.15, lng 107.62). `cekDeforestasi(lat, lng)` → `DeforestasiCheck`
  (status + cell value + disclosure fields). Demo raster is clearly labeled as
  illustrative; format matches the blueprint so the real JRC-derived file drops in.
- **GPS:** `expo-location`, one-shot `getCurrentPositionAsync` with accuracy shown in
  meters; if accuracy > 20 m show "akurasi rendah di bawah kanopi (point-primary)".
- **Offline:** all logic/data/assets are bundled — the app is offline-first by
  construction. Only map tiles need network (see §4).

## 4. Map (decision: option A)

`react-native-maps` (works in Expo Go on Android via Google Maps provider).
Interactive map centered on Pangalengan (lat -7.15, lng 107.62, zoom ~13),
tap → `{lat, lng}`, markers for saved plots.

**Offline fallback:** when offline (detected via `@react-native-community/netinfo`
or map tile failure), render a styled tap-grid panel over the Pangalengan bounding
box that interpolates touch position → lat/lng — the same fallback the website
blueprint specifies. Coordinates and all downstream logic work identically.

Rejected alternatives: bundled static map image (no pan/zoom), WebView+Leaflet
(bridge complexity not worth it in the time budget).

## 5. Screens

Bottom tabs ordered by demo flow:

| Tab | Content |
|---|---|
| **Lapangan** | Map/fallback picker + PlotForm (nama petani wajib; desa, telepon opsional; komoditas default "kopi") + saved plot list + "Muat data demo" seed button |
| **Kartu** | KartuCard: passport-page layout, tier stamp (Lokal/Export-Ready), StdbStatus, reasons list, deforestation result, manual override button, DATA DEMO badge, accuracy fine print |
| **Rantai** | HashChainViewer: chain entries with mono hashes, "Verifikasi Rantai" button, "Simulasi ubah data" button → chain breaks visibly (green→red at broken entry) |
| **Izin** | ConsentPanel: grant/revoke per kartu, AccessLog list, "Simulasi akses tak-terotorisasi" button → creates alert NotifItem |

Global: NotifBanner (red, severity alert, mark-as-read) rendered above tabs;
OfflineIndicator badge in header ("🟢 Online" / "🔴 Offline (mode lapangan)" —
offline is framed as a feature, not an error).

Save flow: submit PlotForm → `addPetani` → `addPlot` → run `cekDeforestasi` →
`ruleEngine` → `addKartu` → append hash-chain entry → navigate to Kartu tab.
Target: < 30 seconds from app open to saved plot.

## 6. Theme — "Paspor" design language

The app looks like a digital passport. Extends the blueprint tokens
(#1F5C3A, #2E7D4F, sans, big buttons, high contrast, Indonesian text).

**Colors**

| Token | Value | Use |
|---|---|---|
| `cover` | `#1F5C3A` | headers, tab bar, passport-cover surfaces |
| `action` | `#2E7D4F` | primary buttons, active states |
| `paper` | `#F7F3E8` | screen/card backgrounds — warm cream, not sterile white |
| `ink` | `#26241F` | body text — near-black warm gray |
| `ok` | green (derived from cover) | chain intact, Export-Ready, online |
| `warn` | amber | tier Lokal, low GPS accuracy, warnings |
| `alert` | red | tampered chain, unauthorized access, offline badge |

**Typography (all via @expo-google-fonts):** Plus Jakarta Sans for UI,
Lora for Kartu headings — official-document feel, Space Mono for hashes.

**Motifs:** Kartu rendered as a passport data page — stamp-style tier badge,
ruled data rows, "DATA DEMO" watermark badge, accuracy disclosure as fine print:
"Peta risiko: JRC GFC2020, akurasi ~91%, commission error ~18%. Titik lokasi
point-primary (GPS di bawah kanopi meleset 3–11 m). Rantai verifikasi =
hash-chain (bukan blockchain). Data demo berlabel."

**Accessibility:** large touch targets (≥ 48dp), high contrast on paper/cover
surfaces, works one-handed in the field.

## 7. Error handling

- GPS permission denied / unavailable → map tap still works; form shows hint.
- GPS accuracy > 20 m → non-blocking point-primary note.
- Coordinate outside raster bbox → explicit "di luar area peta risiko" status
  (never a crash or silent wrong answer).
- All storage ops async with try/catch; failures surface as a visible toast/banner
  in Indonesian, never silent.
- Offline → OfflineIndicator + map fallback; all core flows keep working.

## 8. Verification

- **Unit tests (jest-expo):** `ruleEngine.ts` (tier decisions per input matrix) and
  `hashchain.ts` (chain build, verify, tamper detection). These guard the demo.
- **Demo script:** written 6-step rehearsal script executed on a real Android phone
  in airplane mode end-to-end before calling it done.
- Deliberate deviation from the usual 80% coverage bar — hackathon triage;
  the two pure cores are tested, UI is verified by rehearsal.

## 9. Build order (< 12 h)

1. Scaffold (create-expo-app) + theme tokens + tabs + types + db.ts + dummy seed
   → **app is demoable from here on**
2. ruleEngine + geospatial (demo raster) + Kartu screen
3. hashchain + HashChainViewer + tamper simulation ← wow moment secured
4. Map + GPS + PlotForm (full save flow wired end-to-end)
5. Consent + AccessLog + NotifBanner + override
6. Airplane-mode rehearsal + polish + (if time) EAS APK

## 10. Risks

| Risk | Mitigation |
|---|---|
| react-native-maps issues in Expo Go | Offline tap-grid fallback doubles as the plan-B picker; switch takes minutes |
| Expo Go not on the demo phone / no dev setup | Step 1 verifies `npx expo start` + phone connection before anything else |
| Website team's raster format differs | Loader isolated in `geospatial.ts`; format documented; swap is one file |
| Time overrun | Cut order in §2; steps 1–3 alone still demo the money moments with seeded data |
