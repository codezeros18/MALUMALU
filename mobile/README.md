# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Layanan Harga (WA Bot)

Modul `src/lib/harga/` mengimplementasikan referensi harga harian lewat WhatsApp
sesuai "Cara Kerja": sumber harga → agregasi → balasan bot.

- **`types.ts`** — domain harga (PriceSource, ReferencePrice) dengan vocabulary
  dipadankan ke app (`komoditas`, `wilayah`, STDB+GPS).
- **`prices.ts`** — sumber harga contoh (sample/seed, berlabel "DATA DEMO").
  Ganti dengan feed platform (deal agent/exporter) + eksternal (Bappebti) saat ada.
- **`aggregate.ts`** — `getReferencePrice`: saring (komoditas×wilayah, terverifikasi,
  jendela 7 hari) lalu hitung rata-rata berbobot, low/high, dan jumlah transaksi.
- **`bot.ts`** — `parsePriceQuery` + `handlePriceMessage`: memformat balasan
  `📊 Harga referensi … (update hari ini)` + nudge STDB+GPS + link status.
- **`pasporLookup.ts`** — `lookupPasporByPhone`/`resolvePasporForBot`: menghubungkan
  bot ke data Paspor Petani (AsyncStorage di app; ganti ke datastore platform bila
  bot berjalan di backend terpisah).

**Deep link:** balasan bot menunjuk ke `pasporpetani://status` yang dibuka oleh
`src/app/status.tsx` (menampilkan kelengkapan STDB+GPS dan tier petani).

### Server webhook (`server/`)

`server/wahaWebhookServer.ts` adalah proses Node terpisah (bukan bagian bundle
Expo) yang menerima event pesan masuk dari WAHA dan membalas otomatis:

- **`webhookParser.ts`** — `parseInboundWebhook` (ekstrak telepon+body dari event
  WAHA, abaikan `fromMe` agar tidak echo-loop) dan `shouldRespond` (hanya
  membalas pesan berawalan "harga", agar tidak spam balasan ke chat lain).
- **`wahaWebhookServer.ts`** — server HTTP (`POST /webhook`) yang memanggil
  `handlePriceMessage` lalu `sendText` memakai konfigurasi `.env` yang sama.

Jalankan dengan `npm run waha:webhook` (perlu `.env` terisi + WAHA berjalan).
Lalu daftarkan webhook ke sesi WAHA:

```bash
curl -X PUT http://localhost:3000/api/sessions/default \
  -H "Content-Type: application/json" -H "X-Api-Key: $EXPO_PUBLIC_WAHA_API_KEY" \
  -d '{"name":"default","config":{"webhooks":[{"url":"http://host.docker.internal:3001/webhook","events":["message"]}]}}'
```

Catatan: server ini tidak bisa membaca `AsyncStorage` milik app mobile, jadi
balasan tidak menyertakan nudge Paspor personal (lihat `pasporLookup.ts` untuk
kenapa) dan harga masih memakai `prices.ts` (DATA DEMO) — ganti ke feed
platform asli saat tersedia.
