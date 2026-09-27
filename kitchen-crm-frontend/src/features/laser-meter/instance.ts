/** App-wide singletons. Tests construct their own instances with injected dependencies. */

import { LaserMeterService } from './core/LaserMeterService';
import { SettingsStore } from './core/settings';

export const laserMeter = new LaserMeterService();
export const laserSettingsStore = new SettingsStore();
