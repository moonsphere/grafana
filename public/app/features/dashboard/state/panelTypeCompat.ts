// Compatibility shim for dashboards/snapshots exported from newer Grafana.
//
// This snapshot viewer is built on Grafana 7.1.5, whose panel plugin registry
// (see app/features/plugins/built_in_plugins.ts) predates the `timeseries`
// panel that became the default in Grafana 7.4+. Loading such a snapshot
// otherwise fails plugin lookup in importPanelPlugin() and renders
// "Panel plugin not found: timeseries" for every panel.
//
// Because this build only ever *displays* snapshot data (no editing, no live
// queries), we transparently downgrade unsupported newer panel types to the
// closest legacy panel that exists in the registry, so the captured series
// still draw. Newer style / field-config options the legacy panel does not
// understand are simply ignored — never a hard error.

// Maps an unsupported (newer) panel `type` to a legacy panel `type` registered
// in built_in_plugins.ts. Add entries here as new panel types are encountered.
const LEGACY_PANEL_TYPE: { [newType: string]: string } = {
  timeseries: 'graph',
};

function downgradePanel(panel: any): void {
  if (!panel || typeof panel.type !== 'string') {
    return;
  }

  const legacy = LEGACY_PANEL_TYPE[panel.type];
  if (legacy) {
    // Keep the original type around for debugging / possible UI hinting.
    panel.__originalType = panel.type;
    panel.type = legacy;
  }

  // Collapsed rows carry their children inline under `panels`.
  if (Array.isArray(panel.panels)) {
    panel.panels.forEach(downgradePanel);
  }
}

// Rewrites unsupported panel types in-place across a raw dashboard panel list,
// including panels nested inside collapsed rows. Safe to call on any input.
export function downgradeUnsupportedPanels(panels: any): void {
  if (!Array.isArray(panels)) {
    return;
  }
  panels.forEach(downgradePanel);
}
