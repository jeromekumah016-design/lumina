# Lumina - Mobile App

Curated small-group travel for platonic friendships.

**PURE MOBILE APP ONLY.** React Native + Expo + NativeWind. Website creation will be done later. No web, no localhost previews by tooling. You control running `npx expo start` for your phone's Expo Go.

## Run on your Android phone (app-based only)

**Website creation is deferred. Everything is mobile app from now on. Do not use web previews.**

You run the dev server yourself on your PC when ready to test on phone. The AI will not launch localhost, tunnels, or servers.

1. Install dependencies (in your terminal, in the lumina folder)
   ```bash
   npm install
   ```

2. Start the dev server **yourself**

   - For most reliable connection on same WiFi (recommended first try):  
     ```bash
     npm run lan
     ```
     Then use the `exp://192.168.x.x:8081` (LAN) URL in Expo Go.

   - For tunnel (when not on same WiFi):  
     ```bash
     npm run tunnel
     ```

   Both use `--clear` for a clean bundle after code changes.

3. On your Android phone (with Expo Go app installed): manually enter the URL shown (the `exp://...` one from terminal or Metro UI at http://localhost:8082). No QR needed if you prefer typing.

The main experience is in the **Game** tab: collaborative property selection (Keep/Eliminate voting) for group trips. Starts with Chicago (cities first: Chicago, New York, Atlanta, Miami supported).

See src/components/PropertySelectionScreen.tsx for the core UI.

## Project structure
- src/app/ : tab screens (Feed, Trips, Game, Chat, Profile)
- src/components/PropertySelectionScreen.tsx : the main game view
- src/services/propertyService.ts : mock data for properties per city, group (7 women 4 men)

## Next
- Continue polishing UI (more screens, animations, real data)
- Add features: vote limits enforcement (2 votes), results view, per-property comments, full onboarding
- Align closer to full Lumina product (4M/7F matching, membership)
- Build for release later

Recent: Game screen + supporting tabs polished + new flows.
- Onboarding wizard (welcome, profile+gender+city, explicit 4M/7F co-ed trip disclosures + conduct, ID/BG verify stubs, complete).
- Membership/Subscribe screen (pricing, benefits, mock subscribe that activates hasActiveMembership).
- Matching/Queue screen (4-to-7 rule explanation, queue visuals, join + simulateMatch that forms group and links to Game).
- Profile and Feed now surface journey status and quick links to the new screens.
- userService.ts for persisted onboarding/membership/matching state.
Core game test + tsc clean.

Run on your phone to test the actual native app.
Miami data addition prepared - 6 properties ready to insert (Ocean Drive, Wynwood, Brickell, Coconut Grove, Design District, Little Havana)

## GitHub

This app was added to https://github.com/jeromekumah016-design/lumina via the Grok tooling (source + configs). Binary assets (PNG icons/splash) are referenced in app.json but may need to be re-added from local clone or regenerated via expo for full builds. After `git clone`, run `npm install` to restore node_modules and lockfile.
