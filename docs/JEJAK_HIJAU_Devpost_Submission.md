# 🌿 DEVPOST SUBMISSION — JejakHijau (MALU MALU)
### Garuda Hacks 7.0 · Track: Agriculture & Food Systems
> Semua isi field di bawah dalam Bahasa Inggris (wajib). Tinggal copy per bagian ke Devpost.
> Sudah di-humanize (tanpa em-dash, ritme natural). Catatan/aksi untuk tim ditandai `[TIM: ...]`.

> **🎯 JANGKAR NARASI (biar konsisten dgn deck, jangan drift):**
> Jangkar utama = **dokumen terverifikasi sebagai gerbang ekonomi dua-sisi**:
> (1) sisi petani → harga wajar (anti-ijon) + KUR/subsidi + proteksi identitas;
> (2) sisi eksportir → **kepatuhan EUDR** (2-3 minggu → ±1 jam).
> **Jember = contoh pendukung** untuk pilar proteksi identitas, BUKAN hook utama.
>
> **🔧 FIX DECK sebelum presentasi:** (a) Slide 6 ganti "bukti blockchain" → **"bukti hash-chain"**
> (konsisten Slide 8, hindari palu juri anti-hype); (b) "+24% pendapatan" Slide 9 beri label
> **ilustratif/target** (yang aman diklaim: 2-3 minggu → ±1 jam); (c) cross-check BPN/Dinas +
> AI (Slide 8) sebut **assistive/planned**, bukan fitur jadi.

---

## 1. PROJECT NAME
```
JejakHijau
```
`[TIM: ini nama proyek, bukan nama tim. Rebrand dari Paspor Petani.]`

---

## 2. ELEVATOR PITCH (max 200 karakter — pilih satu)

**Opsi A (±190 char) — dual anchor (rekomendasi):**
```
Verified documents are a smallholder's gateway to a fair price and KUR credit, and an exporter's shortcut to EUDR compliance. JejakHijau turns weeks of paperwork into one farmer-owned passport.
```

**Opsi B (±170 char) — sisi petani duluan:**
```
JejakHijau gives smallholders verified, farmer-owned documents, so they escape ijon prices, reach KUR credit, and let exporters prove EUDR compliance in an hour instead of weeks.
```

**Opsi C (±150 char) — paling ringkas:**
```
Verified farmer-owned land documents: a fair price and credit for smallholders, instant EUDR-ready traceability for exporters. Built offline first.
```

---

## 3. ABOUT THE PROJECT (Markdown)

```markdown
## The gap we are closing

A smallholder coffee farmer in Indonesia loses on both ends of the same missing thing: verified documents. Without a registered plot, land proof, or a verified identity, a farmer has no bargaining power. They sell to middlemen at ijon prices far below the market, they wait weeks for a KUR loan decision, and their identity can even be misused without them knowing, as it was for hundreds of farmers in the Jember fraud case.

At the other end of the chain, exporters now face the EU Deforestation Regulation. From 2025 to 2026 it requires proof that coffee did not come from land cleared after 2020: precise geolocation, legal land documents like STDB, and a risk assessment for every supplier. Today that audit runs two to three weeks per batch, and most smallholders are not documented at all.

So one missing thing, verified documentation, blocks the farmer from a fair price and blocks the exporter from compliance. That is the gap JejakHijau closes.

## What JejakHijau does

JejakHijau is a two sided platform where documentation is the input and economic access is the output. A field officer registers a farmer, verifies the plot and identity, and the app checks the plot against a deforestation map (JRC Global Forest Cover 2020) completely offline. The result is a digital passport the farmer owns.

For the farmer and agent side, that passport unlocks three things. A fair reference price through a WhatsApp bot, so a farmer can text "harga kopi Pangalengan" and stop selling blind. A faster path to KUR credit and subsidy, because the documents come out formatted ready to submit. And real time protection, where the farmer decides who may open their documents and gets a notification the moment anyone tries. That last part is where cases like Jember stop, because access is on the farmer's terms.

For the exporter side, the same passport turns a two to three week manual audit into an EUDR dossier in about an hour: supplier list, JRC based risk assessment, and a tamper evident record. Exporters can also see verified nearby plots and source directly at a fair market price instead of through opaque middlemen.

## How it works, honestly

The core is deterministic, not a guessing AI. The plot check runs on the phone with no internet at all, sampled against the forest map cell by cell across the whole garden boundary. Every card decision is sealed into a hash chain, so if anyone edits a record later, it shows immediately. We chose a hash chain, not a blockchain, on purpose: same tamper evidence, runs offline, no hype. Access is consent gated, and when there is no signal in the field, new data waits in a local queue and syncs the moment a connection returns.

We are open about the limits. The forest map is about 91 percent accurate with an 18 percent commission error, so shaded coffee under a canopy can read as forest. We show that number and flag those plots for manual audit instead of rejecting them, and when risk comes back medium or high, the app surfaces concrete next steps, ground truthing, buffer restoration, reforestation, instead of a bare warning. The officer walks the actual corners of the garden rather than tagging one point, but GPS still drifts 3 to 11 meters per corner under tree cover, so we call it a field estimate, not survey grade. Cross checks to government databases are on our roadmap, not built yet, and we say so rather than implying they run today. JejakHijau is decision support with a human in the loop.

## Who pays, and why it lasts

Not the farmer. Exporters carry the cost, because EUDR compliance and supplier trust are their problem to solve, and JejakHijau turns weeks of audit into an hour. The farmer gets a fair price, faster credit, and protection at no cost. We are grounded in a real coffee supply chain in Pangalengan through a family run exporter, so this is not a market we imagined from a desk. To be precise, that is access and pilot interest, not a signed contract yet.
```

---

## 4. BUILT WITH (tags, maks 25)

```
react, typescript, vite, tailwindcss, maplibre-gl, turf.js, supabase, postgresql,
row-level-security, indexeddb, web-crypto-api, crypto-js, waha,
whatsapp, node.js, expo, react-native, jrc-global-forest-cover-2020, vercel,
jest, playwright, claude, service-workers
```
`[TIM: MapLibre sudah menggantikan Leaflet — pastikan Leaflet dihapus dari repo. Buang tag yang tidak dipakai kalau ada.]`

---

## 5. "TRY IT OUT" LINKS (maks 3)

```
[TIM: ISI — deployed Vercel URL, contoh: https://jejak-hijau.vercel.app]
https://github.com/codezeros18/MALUMALU
```
`[TIM: WAJIB ada link produk yang bisa dibuka juri (Vercel) + repo. Uji buka pakai incognito. Kalau ada demo terpisah/video, itu masuk field video, bukan sini.]`

---

## 6. VIDEO DEMO LINK (YouTube, publik, 2 menit)

```
[TIM: ISI — link YouTube publik. Uji di incognito.]
```

**Struktur 2 menit yang direkomendasikan:**
```
0:00-0:18  Hook (jangkar ganda): satu dokumen yang hilang mengunci dua sisi —
           petani terjebak harga ijon & KUR lambat; eksportir kena audit EUDR 2-3 minggu.
0:18-0:35  Masalah: petani gurem tak terdokumentasi = tak punya daya tawar; eksportir
           tak bisa buktikan bebas-deforestasi. (Jember disebut singkat sebagai contoh risiko identitas.)
0:35-1:15  DEMO LIVE (matikan wifi di depan kamera):
           agen jalan-keliling batas kebun (poligon) -> cek deforestasi JRC OFFLINE -> passport
           milik petani (tier lokal/export), rantai hash "utuh" -> akses tanpa izin -> NOTIF ke petani
1:15-1:40  Dua sisi: petani lihat harga wajar (WA bot) + unduh PDF; eksportir -> dossier EUDR ~1 jam
           + peta lahan terverifikasi + antrian offline auto-sync
1:40-2:00  Payer = eksportir (grounded di rantai pasok kopi Pangalengan) +
           tutup jujur: "decision support, human in the loop; peta 91%, kami disclose"
```

---

## 7. DEVELOPMENT PROCESS

```
We started from a single uncomfortable question. Why do the farmers who feed the country stay invisible to the systems that decide their credit, subsidies, and prices? The Jember fraud case made it concrete, so we designed around one idea: the farmer should own their data, not just be recorded in someone else's.

We made an early call to keep the core deterministic. A plot either falls on a forest pixel or it does not, and a rule engine decides tier and readiness from clear conditions, so a judge can audit every step. We were careful not to let an AI make the decisions that affect someone's loan.

We built offline first, because the field has no signal. The deforestation map is cropped to Pangalengan, self hosted, and read on device. Then we layered production on top with Supabase: three roles behind a lightweight selector for the demo, and row level security that is append only on the security-critical tables, the hash chain, the access log, and uploaded documents, so a past record can never be silently rewritten. Offline writes go into a local queue and flush automatically when the connection returns. Real authentication and full per-role data isolation are the next milestone, honestly labeled as such rather than claimed early.

The hardest choices were about honesty, not code. GPS drifts under canopy, so even though officers now walk and mark the actual boundary of a garden, we still call it a field estimate rather than a survey. The forest map has an 18 percent commission error, so we disclose it and route those plots to manual audit. We picked a hash chain over a blockchain because it gives real tamper evidence without the theatrics. Along the way we moved our map layer from Leaflet to MapLibre for smoother vector rendering, and we rebranded the project from Paspor Petani to JejakHijau to put the deforestation-free story front and center.
```

---

## 8. TOOLS USED

```
The web app is React with Vite and TypeScript, styled with Tailwind. The map runs on MapLibre GL JS, and we use Turf.js for the geometry, including the point in polygon sampling that scores deforestation risk. The deforestation layer itself is JRC Global Forest Cover 2020, cropped to our demo region and served locally so the check works offline.

Our backend is Supabase Postgres, synced through an outbox queue so nothing is lost offline, with row level security locking the hash chain, the access log, and uploaded documents to append only. On device we use IndexedDB as the primary local store. Live access alerts go out over WhatsApp through WAHA rather than a websocket channel, so a farmer gets notified even with the app closed. The tamper evident hash chain uses the Web Crypto API and crypto-js.

For price transparency we run a WhatsApp bot through WAHA with a small Node webhook server, so a farmer can text a question and get a reference price. We deploy the web app on Vercel with Supabase as the backend. We test with Jest and Playwright. We used Claude, through Claude Code, as our main coding and debugging assistant throughout.
```

---

## 9. AI USAGE DISCLOSURE

```
We were transparent with ourselves about this from the start. We used Claude, mainly through Claude Code, across the whole build: brainstorming the approach, planning architecture, writing and refactoring code, debugging, and drafting documentation. When we used auto mode to generate code, we reviewed it and made sure we understood how it worked rather than shipping it blindly.

To be clear about what is not AI: the decisions that matter run on deterministic logic, not a model. The plot check, the rule engine that sets tier and readiness, the hash chain, and the consent and notification engine are all rule based and auditable. We do offer an optional feature that uses a language model to help draft a farmer dossier in nicer prose, but it always has a plain template fallback, it is labeled, and it never changes the actual status or any credit decision.
```

---

## 10. COPYRIGHT MATERIALS

```
Our deforestation layer is JRC Global Forest Cover 2020, which is openly licensed and used with attribution. Map rendering uses MapLibre GL JS (BSD licensed) with OpenStreetMap based tiles (ODbL). Icons are from lucide-react (ISC license). Any base fonts are open licensed system or web fonts.

Everything else, including the application code, the data model, the hash chain, the three role dashboards, the UI design, and the WhatsApp flow, was built by our team during the hackathon. The price data shown in the demo is labeled sample data, pending a real verified transaction feed.
```
`[TIM: sesuaikan kalau pakai icon/font/aset lain. Kalau semua sisanya buatan sendiri, kalimat terakhir sudah cukup.]`

---

## 11. ANYTHING THAT CAN HELP JUDGES (opsional tapi kuat — isi)

```
A few honest notes to help you evaluate us fairly.

Known limits: The forest map is about 91 percent accurate with an 18 percent commission error, so shaded coffee can read as forest. We disclose this in the app and flag those plots for manual audit rather than rejecting them. The officer walks the actual boundary of the garden, but GPS still drifts under canopy, so we call it a field estimate rather than a survey. Authentication is a role selector for this demo, not real Supabase Auth, and we say so directly in the app rather than implying otherwise, real login is our next milestone.

Real world grounding: We are connected to a real family run coffee exporter with active smallholder suppliers in Pangalengan. To be precise, this is access and pilot interest, not a signed contract, and the supplier data in the demo is realistic sample data, clearly labeled.

For the best demo: watch the offline moment. We turn off the connection on camera, and the plot check, passport, hash chain, and consent notification all keep working. Then watch the alert fire the instant someone tries to access data without permission, and open the exporter's EUDR evidence packet to see the same hash chain integrity check running against a real supplier record.
```

---

## 12. TEAM NAME - TEAM NUMBER
```
MALU MALU - 62
```

---

## 13. TEAM MEMBERS (alfabetis by first name)
```
Kenny Valent Winalda Sembiring, Lintang Balakosa Ardhana, Nanda Valeri, Vassel Goleyu
```

---

## 14. SUBMISSION TRACK
```
Agriculture & Food Systems
```

---

## 15. IMAGE GALLERY — REKOMENDASI (3:2 ratio, JPG/PNG, maks 5MB, beri label "demo data")

Urutan yang gue saranin (8 gambar, cover paling penting duluan):

1. **COVER (hero):** passport card petani + peta MapLibre di belakang. Ini thumbnail Devpost, bikin paling niat.
2. **Tap plot + hasil deforestasi:** agen tap titik di peta, muncul status "aman/perlu-audit" + disclosure 91%/18%.
3. **Passport card (tiered):** kartu milik petani, tampak tier Lokal vs Export-Ready.
4. **Hash-chain viewer:** badge "Rantai utuh" (hijau) di halaman Detail Plot atau Paket Bukti EUDR eksportir.
5. **Consent + notif akses:** panel izin + banner notif "akses tanpa izin terdeteksi". (Ini hero anti-Jember.)
6. **Eksportir dashboard:** monitoring rantai pasok + StatCard (stdb-ready, perlu-audit).
7. **Petani portal + PDF:** tampilan petani lihat passport sendiri + tombol unduh PDF.
8. **WhatsApp harga:** screenshot chat "harga kopi Pangalengan" → balasan range/avg + jumlah transaksi.

Opsional kalau muat: diagram arsitektur (offline queue → Supabase), indikator sync "menunggu → tersinkron".

---

## 📌 CHECKLIST SEBELUM SUBMIT
- [ ] Project name = "JejakHijau" (bukan nama tim)
- [ ] Elevator pitch dipilih & di bawah 200 char
- [ ] Deployed Vercel URL diisi di "Try it out" + repo MALUMALU + uji incognito
- [ ] Video YouTube publik 2 menit + uji incognito
- [ ] Leaflet sudah dibuang, MapLibre saja (konsisten dgn "Built with")
- [ ] Semua field English
- [ ] Hanya 1 orang inisiasi project (submission ganda = DQ)
- [ ] Image gallery diberi label "demo data"
- [ ] Track = Agriculture & Food Systems
- [ ] Tetap contactable sampai queue number diumumkan 17 Juli ~22:00 WIB
