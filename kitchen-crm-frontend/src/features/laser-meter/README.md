# Laser Meter module

Device-agnostic support for Bluetooth laser distance meters in Site Measurement Mode.
Nothing in this module assumes a particular make of meter: everything device-specific is an
**adapter** (admin-managed configuration, or a small TS class for complex protocols), and the
**Device Lab** exists to work out a new meter's data format.

All measurements are **integer millimetres**.

## Assumptions

- The repo's backend is **Spring Boot 3 + MySQL + Flyway** (not NestJS/PostgreSQL as the brief
  assumed). The backend part follows the repo's conventions instead: `JSON` columns where the brief
  says `JSONB`, `ApiResponse<T>` envelopes, `@PreAuthorize("hasRole('SUPER_ADMIN')")` for "admin".
- There was no measurement screen yet (only a free-text `siteMeasurements` field and a
  "site visit" flag on production). So this module is self-contained, and a new
  **Site Measurement** page (`/customers/:id/site-measurement`) is its first consumer.
- "Admin" = `ROLE_SUPER_ADMIN`. The Device Lab and the adapter editor are admin-only.
- Web Bluetooth only works on HTTPS (or `localhost`) in Chromium browsers (Chrome/Edge on
  Android, Windows, macOS, ChromeOS). iPad/iPhone browsers have no Web Bluetooth: they use
  keyboard (HID) mode or manual entry.
- Settings are per user **and** per device (browser `localStorage`, keyed by user id), because a
  surveyor's phone and office desktop legitimately want different modes.
- Adapters are cached in `localStorage` so measuring keeps working with no signal on site.

## Layout

```
laser-meter/
  core/                       framework-agnostic TypeScript (no React)
    types.ts                  shared types (measurement, adapter config, parser config, state)
    units.ts                  unit conversion + display formatting
    hex.ts                    hex/ASCII helpers
    parser.ts                 pure packet parser (binary + ascii) with range checks
    adapterValidation.ts      adapter config validation (mirrors the server)
    hidInputParser.ts         parse text typed by a keyboard-mode meter
    keystrokeTiming.ts        device-vs-human keystroke classifier
    keystrokeBuffer.ts        collects keystrokes into one capture (Enter/Tab/idle)
    guidedSequence.ts         measurement target order (walls → ceiling → openings → services)
    measurementSession.ts     captured values + metadata + undo (pure reducer)
    decodingProbe.ts          Device Lab: brute-force decodings that equal a known reading
    reconnect.ts              reconnect backoff scheduler (1s, 2s, 5s, 10s, then manual)
    emitter.ts                tiny typed event emitter
    settings.ts               per-user/device settings (localStorage)
    feedback.ts               beep + vibration
    LaserMeterService.ts      singleton; owns mode, device state, emits `measurement`
    adapters/                 adapter registry, config-driven adapter, built-ins (generic, mock)
    connections/              BleConnection, KeyboardConnection, MockConnection, Web Bluetooth
                              typings/feature detection, GATT explorer for the Device Lab
  api/laserMeterAPI.ts        RTK Query endpoints (adapters, lab logs, site measurements)
  hooks/                      useLaserMeter, useGuidedMeasure, useLaserSettings
  components/                 LaserStatusChip, ConnectLaserButton, MeasureField, LaserSettings,
                              GuidedMeasurePanel, AdapterAdmin, device-lab/DeviceLab
  __tests__/                  vitest unit tests
```

## Public API (what a measurement screen calls)

```ts
import {
  laserMeter,            // LaserMeterService singleton
  useLaserMeter,         // { state, connectBle, enableKeyboard, disconnect, trigger, simulate… }
  useGuidedMeasure,      // guided sequence + captured values + undo
  GuidedMeasurePanel,    // ready-made guided flow UI
  MeasureField,          // a single input that can receive laser readings
  LaserStatusChip,
} from '@/features/laser-meter';

const off = laserMeter.on('measurement', (m) => {
  // m = { valueMm, source: 'laser_ble' | 'laser_hid' | 'manual', raw, at, adapterId }
});
```

## Adding a new meter

1. Admin → Laser Meter → **Device Lab**. Connect to the meter (any BLE device is listed).
2. Expand its services, subscribe to each characteristic that can *notify*, take a reading.
3. Next to the packet that arrived, type the distance shown on the meter's screen
   (e.g. `2345`, `2.345 m`) and press **Mark reading**. Candidate decodings that equal the typed
   value are highlighted. Mark 2–3 different distances: decodings consistent across all marks
   rise to the top.
4. **Save as Adapter** on the winning decoding. Tweak name filters/range in **Adapters**.
5. If the meter needs a trigger command, set the trigger characteristic + payload hex there.
6. **Export log** and attach it to a ticket if the format isn't obvious.

A protocol too complex for config (multi-packet frames, checksums, handshakes) gets a
code adapter: implement `LaserMeterAdapter` and call `adapterRegistry.registerCode(...)`.

## Running

```
cd kitchen-crm-frontend
npm test          # unit tests
npm run dev       # dev server — "Simulate reading" and the mock device appear in dev mode
```

Dev tools can also be enabled in production builds from Laser Meter → Settings → "Developer tools".

## Manual test checklist

### Chrome on Android tablet (Web Bluetooth)
- [ ] Served over HTTPS; Settings shows Bluetooth mode available.
- [ ] Connect Laser Meter → system chooser shows only meters matching the adapter's filters.
- [ ] Status chip goes Connecting → Connected; battery % shows if the meter exposes it.
- [ ] Take a reading on the meter → active field fills, flashes, beeps/vibrates, advances.
- [ ] Remote trigger button (only if the adapter defines one) fires a measurement.
- [ ] Turn the meter off → chip shows Reconnecting (1s, 2s, 5s, 10s) then Disconnected with
      a Reconnect button. Turn it on within the window → reconnects without a chooser.
- [ ] Reload page → "Reconnect <name>" offered (where the browser supports `getDevices()`).
- [ ] Out-of-range reading (e.g. pointing at the sky) is rejected with a message, not stored.
- [ ] Edit a captured value → saved with `editedAfterCapture = true`. Undo restores previous.
- [ ] Save → reload → values and metadata persist.

### Chrome on desktop
- [ ] Same as above with a USB/built-in Bluetooth adapter.
- [ ] Device Lab: connect to any BLE device, list services/characteristics with properties,
      subscribe, see hex + ASCII log with timestamps, mark reading, save adapter, export JSON.
- [ ] Adapters admin: create/edit/deactivate/delete; audit history shows each change.
- [ ] Dev mode: mock device connects, "Simulate reading" drives the whole flow; simulated
      disconnect exercises the reconnect backoff.

### Safari on iPad (keyboard + manual)
- [ ] Settings hides Bluetooth mode and explains keyboard/manual are available.
- [ ] Pair the meter as a Bluetooth keyboard in iPadOS settings.
- [ ] Keyboard mode: active field shows "Waiting for measurement…", the on-screen keyboard
      does not pop up; a reading from the meter fills the field and auto-advances.
- [ ] Typing by hand into the capture field is detected as manual (source = manual) or
      rejected, per the "accept hand-typed values" setting.
- [ ] "Type manually" switches to the normal numeric keyboard.
- [ ] Values like `2.345`, `2,345 m`, `234.5cm`, `92.3 in`, `7' 8"` parse correctly.
- [ ] Manual mode: whole sequence can be completed with the on-screen keyboard alone.
