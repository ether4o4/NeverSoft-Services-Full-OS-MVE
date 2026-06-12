/**
 * The macOS app set — names, squircle glyphs/colors, and which live in the Dock.
 */
export interface MacApp {
  id: string;
  name: string;
  glyph: string;
  colors: [string, string];
  inDock?: boolean;
}

export const APPS: MacApp[] = [
  { id: 'finder', name: 'Finder', glyph: '🗂️', colors: ['#46b6ff', '#1c7fe0'], inDock: true },
  { id: 'safari', name: 'Safari', glyph: '🧭', colors: ['#8fd9ff', '#1f8fe8'], inDock: true },
  { id: 'messages', name: 'Messages', glyph: '💬', colors: ['#5cf07a', '#1ec64a'], inDock: true },
  { id: 'music', name: 'Music', glyph: '🎵', colors: ['#fb5a78', '#e22a52'], inDock: true },
  { id: 'photos', name: 'Photos', glyph: '🌸', colors: ['#ffd36e', '#ff7a59'] },
  { id: 'terminal', name: 'Terminal', glyph: '>_', colors: ['#3a3a3d', '#0c0c0c'], inDock: true },
  { id: 'ghost-key', name: 'Ghost Key', glyph: '🗝️', colors: ['#8a6cff', '#4a2fd0'] },
  { id: 'neversoft', name: 'NeverSoft', glyph: 'NS', colors: ['#2a2a2e', '#000000'] },
  { id: 'google', name: 'Google', glyph: '📂', colors: ['#5b8def', '#3a6fd0'] },
  { id: 'microsoft', name: 'Microsoft', glyph: '🟦', colors: ['#5b8def', '#3a6fd0'] },
  { id: 'settings', name: 'System Settings', glyph: '⚙️', colors: ['#b6bbc2', '#6b7077'], inDock: true },
  { id: 'launchpad', name: 'Launchpad', glyph: '🚀', colors: ['#9aa0a8', '#5a5f68'], inDock: true },
  { id: 'trash', name: 'Trash', glyph: '🗑️', colors: ['#c8ccd2', '#8a909a'], inDock: true },
];
