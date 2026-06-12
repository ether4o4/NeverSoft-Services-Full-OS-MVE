// ============================================
// NeverSoft Aero glass components
// ============================================
// Plain translucent-view implementations (no Skia). The original Skia/shader
// versions crashed the release build at startup, so the glass look is done with
// simple rgba views — consistent with the rest of the app.

export { GlassPanel } from './GlassPanel';
export { GlassButton } from './GlassButton';
export { StartOrb } from './StartOrb';
export { WindowFrame } from './WindowFrame';
export { Taskbar } from './Taskbar';

export type { GlassPanelProps } from './GlassPanel';
export type { GlassButtonProps } from './GlassButton';
export type { StartOrbProps } from './StartOrb';
export type { WindowFrameProps } from './WindowFrame';
export type { TaskbarProps } from './Taskbar';
