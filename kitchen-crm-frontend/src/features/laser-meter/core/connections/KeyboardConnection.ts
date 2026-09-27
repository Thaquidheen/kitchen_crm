/**
 * Keyboard (Bluetooth HID) meters pair with the OS as a keyboard and "type" their readings, so
 * they work in every browser, iPad Safari included. The page can't see the device itself: this
 * connection just marks keyboard mode active; readings arrive through the capture input
 * (MeasureField → LaserMeterService.submitKeyboardCapture).
 */

import type { ConnectionHost, LaserConnection } from './Connection';

export class KeyboardConnection implements LaserConnection {
  readonly mode = 'keyboard' as const;
  private readonly host: ConnectionHost;

  constructor(host: ConnectionHost) {
    this.host = host;
  }

  async connect(): Promise<void> {
    this.host.update({
      status: 'connected',
      deviceId: null,
      deviceName: 'Keyboard-mode meter',
      battery: null,
      canTrigger: false,
    });
  }

  async disconnect(): Promise<void> {
    this.host.update({ status: 'disconnected', deviceName: null });
  }

  async reconnect(): Promise<boolean> {
    return true;
  }
}
