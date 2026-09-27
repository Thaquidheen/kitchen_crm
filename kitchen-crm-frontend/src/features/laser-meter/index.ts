/**
 * Laser meter module — public API. See README.md in this folder.
 *
 * A measuring screen typically needs: `useLaserSettings` + `useApplyLaserSettings`,
 * `useGuidedMeasure`, and `<GuidedMeasurePanel/>` (or individual `<MeasureField/>`s), and can
 * listen to raw readings with `laserMeter.on('measurement', …)`.
 */

// Singletons
export { laserMeter, laserSettingsStore, deviceLab } from './instance';

// Core (framework-agnostic)
export * from './core/types';
export {
  LaserMeterService,
  errorMessage,
  isChooserCancelled,
  type LaserEvents,
  type LogEntry,
} from './core/LaserMeterService';
export { parseReading, parseBinary, parseAscii, parseAsciiText, DEFAULT_ASCII_REGEX } from './core/parser';
export { parseHidInput, type HidDefaultUnit } from './core/hidInputParser';
export { classifyKeystrokes, DEFAULT_KEYSTROKE_TIMING } from './core/keystrokeTiming';
export { KeystrokeBuffer } from './core/keystrokeBuffer';
export { toMm, fromMm, formatMm, normalizeUnit, UNIT_LABELS } from './core/units';
export { validateAdapterConfig } from './core/adapterValidation';
export { AdapterRegistry } from './core/adapters/registry';
export { createConfigAdapter } from './core/adapters/configAdapter';
export { GENERIC_ADAPTER_ID, MOCK_ADAPTER_ID, MOCK_ADAPTER_CONFIG } from './core/adapters/builtins';
export {
  buildSequence,
  nextTargetKey,
  prevTargetKey,
  sanitizeLayout,
  DEFAULT_LAYOUT,
  DEFAULT_SEQUENCE_CONFIG,
  type RoomLayout,
  type SequenceConfig,
  type MeasureTarget,
  type TargetGroup,
} from './core/guidedSequence';
export { sessionReducer, initialSession, valueList, type MeasurementValue } from './core/measurementSession';
export { resolveMode, DEFAULT_SETTINGS, type LaserSettings as LaserSettingsValues } from './core/settings';
export { saveDraft, loadDraft, clearDraft, draftIsNewer, type MeasurementDraft } from './core/draftStore';
export { getBleSupport, type BleSupport } from './core/connections/webBluetooth';

// React
export { useLaserMeter, useApplyLaserSettings } from './hooks/useLaserMeter';
export { useLaserSettings, useLaserDevTools } from './hooks/useLaserSettings';
export { useGuidedMeasure, type GuidedMeasure } from './hooks/useGuidedMeasure';
export { useSelectableAdapters } from './hooks/useAdapters';
export { useSyncAdapters } from './hooks/useSyncAdapters';
export { ConnectLaserButton } from './components/ConnectLaserButton';
export { LaserStatusChip } from './components/LaserStatusChip';
export { LaserModeBar } from './components/LaserModeBar';
export { MeasureField } from './components/MeasureField';
export { GuidedMeasurePanel } from './components/GuidedMeasurePanel';
export { RoomLayoutEditor } from './components/RoomLayoutEditor';
export { LaserSettings } from './components/LaserSettings';
export { AdapterAdmin } from './components/AdapterAdmin';
export { AdapterEditor } from './components/AdapterEditor';
export { DeviceLab } from './components/device-lab/DeviceLab';
export { DeviceLabPanel } from './components/device-lab/DeviceLabPanel';
export { probeDecodings, rankAcrossMarks, type DecodingCandidate } from './core/decodingProbe';
export { LabSession } from './core/connections/bleLab';

// API
export {
  useGetActiveLaserAdaptersQuery,
  useGetSiteMeasurementQuery,
  useSaveSiteMeasurementMutation,
  type SiteMeasurementRecord,
} from './api/laserMeterAPI';
