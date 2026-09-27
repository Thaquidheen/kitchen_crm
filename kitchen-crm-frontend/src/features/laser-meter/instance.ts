/** App-wide singletons. Tests construct their own instances with injected dependencies. */

import { LaserMeterService } from './core/LaserMeterService';
import { SettingsStore } from './core/settings';
import { LabSession } from './core/connections/bleLab';

export const laserMeter = new LaserMeterService();
export const laserSettingsStore = new SettingsStore();
/** One Device Lab session per page load, so switching tabs doesn't lose the log. */
export const deviceLab = new LabSession();
