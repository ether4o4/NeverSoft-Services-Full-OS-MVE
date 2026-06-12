import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  TextInput,
  SafeAreaView,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  BackHandler,
} from 'react-native';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
  Directions,
} from 'react-native-gesture-handler';
import {runOnJS} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

// Context-first registry: open intents are surfaced on the taskbar.
import {ActionRegistry, Intent} from './src/mve/ActionRegistry';

// Import our glass components
import {StartOrb, WindowFrame, Taskbar} from './src/components/glass';

// Import animation hooks
import {useButtonHover} from './src/animations';

// MVE engine pages (chat + Linux sandbox) and settings
import MveScreen from './src/mve/MveScreen';
import MveSettingsScreen from './src/mve/MveSettingsScreen';

// NeverSoft desktop shell: themes, widgets, icons, popups
import ErrorBoundary from './src/ErrorBoundary';
import {ThemeStore} from './src/theme/themes';
import GlassMenu, {MenuItem} from './src/desktop/GlassMenu';
import DesktopWidget, {WidgetSpec} from './src/desktop/DesktopWidget';
import NotificationCenter, {QuickswitchBox} from './src/desktop/NotificationCenter';
import Terminal from './src/desktop/Terminal';
import RecycleBin, {BinnedIcon} from './src/desktop/RecycleBin';
import BrowserPicker from './src/desktop/BrowserPicker';
import FolderWindow from './src/desktop/FolderWindow';
import {
  GOOGLE_APPS,
  MICROSOFT_APPS,
  GHOST_KEY_PKG,
  GHOST_KEY_APK_URL,
  NEVERSOFT_GITHUB_URL,
  openAppOrStore,
  openPlayStore,
  openPlayStoreSearch,
  openUrl,
} from './src/desktop/storeLinks';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// ── Desktop icon model ──
// Classic computer-styled shell icons. `pkg` links an icon to its app on the
// Play Store (used by "App settings" on long-press).
interface IconSpec {
  id: string;
  label: string;
  icon: string;
  pkg?: string;
  /** Permanent fixtures can't be removed from the desktop (no bin entry). */
  permanent?: boolean;
  /** Optional red letters drawn over the icon glyph (e.g. "NS" on a folder). */
  badge?: string;
}

// The shipped/classic desktop set, in classic Windows order: shell folders
// first (Computer → Documents → Pictures → Music), then Internet, the file
// tools, the brand/app shortcuts, Settings, and the Recycle Bin last. Every
// classic icon is `permanent` — it can't be moved or removed; only folders the
// user creates are removable.
const DEFAULT_ICONS: IconSpec[] = [
  {id: 'internet', label: 'Internet', icon: '🌐', permanent: true},
  {id: 'recycle-bin', label: 'Recycle Bin', icon: '🗑️', permanent: true},
  {id: 'computer', label: 'Computer', icon: '💻', permanent: true},
  {id: 'file-explorer', label: 'File Explorer', icon: '🗂️', permanent: true},
  {id: 'documents', label: 'Documents', icon: '📁', permanent: true},
  {id: 'pictures', label: 'Pictures', icon: '🖼️', permanent: true},
  {id: 'music', label: 'Music', icon: '🎵', permanent: true},
  {id: 'cmd', label: 'cmd', icon: '＞_', permanent: true},
  {id: 'neversoft', label: 'NeverSoft', icon: '📁', badge: 'NS', permanent: true},
  {id: 'ghost-key', label: 'Ghost Key', icon: '🗝️', pkg: GHOST_KEY_PKG, permanent: true},
  {id: 'google', label: 'Google', icon: '📂', permanent: true},
  {id: 'microsoft', label: 'Microsoft', icon: '🪟', permanent: true},
  {id: 'settings', label: 'Settings', icon: '⚙️', permanent: true},
];

// Desktop Icon Component
const DesktopIcon: React.FC<{
  label: string;
  icon: string;
  badge?: string;
  onPress: () => void;
  onLongPress?: () => void;
}> = ({label, icon, badge, onPress, onLongPress}) => {
  const {animatedStyle} = useButtonHover();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={420}>
      <Animated.View style={[styles.desktopIcon, animatedStyle]}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{icon}</Text>
          {badge ? (
            <View style={styles.iconBadgeWrap} pointerEvents="none">
              <Text style={styles.iconBadge}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.iconLabel} numberOfLines={2}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Start Menu — a real app drawer: all apps on the left (each pinnable to Start
// or to the taskbar), pinned-to-Start tiles on the right, and a bottom row of
// Settings / Files / Power.
const StartMenu: React.FC<{
  visible: boolean;
  onClose: () => void;
  apps: IconSpec[];
  onLaunch: (icon: IconSpec) => void;
  pinnedStart: string[];
  onTogglePinStart: (id: string) => void;
  pinnedTaskbar: string[];
  onTogglePinTaskbar: (id: string) => void;
  onOpenSettings: () => void;
  onOpenFiles: () => void;
  onPower: () => void;
}> = ({
  visible,
  onClose,
  apps,
  onLaunch,
  pinnedStart,
  onTogglePinStart,
  pinnedTaskbar,
  onTogglePinTaskbar,
  onOpenSettings,
  onOpenFiles,
  onPower,
}) => {
  const launch = (icon: IconSpec) => {
    onClose();
    onLaunch(icon);
  };
  const pinned = apps.filter(a => pinnedStart.includes(a.id));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.startOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.startMenu}>
          <LinearGradient
            colors={['rgba(58,92,150,0.97)', 'rgba(20,34,56,0.98)']}
            style={styles.startGradient}>
            <Text style={styles.startMenuTitle}>Start</Text>
            <View style={styles.menuDivider} />

            <View style={styles.startBody}>
              {/* All apps (left) */}
              <View style={styles.startApps}>
                <Text style={styles.startColLabel}>All apps</Text>
                <ScrollView style={styles.startAppsScroll}>
                  {apps.map(app => (
                    <View key={app.id} style={styles.appRow}>
                      <TouchableOpacity
                        style={styles.appRowMain}
                        activeOpacity={0.7}
                        onPress={() => launch(app)}>
                        <Text style={styles.appRowIcon}>{app.icon}</Text>
                        <Text style={styles.appRowLabel} numberOfLines={1}>
                          {app.label}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        hitSlop={6}
                        onPress={() => onTogglePinStart(app.id)}
                        style={[styles.pinBtn, pinnedStart.includes(app.id) && styles.pinBtnOn]}>
                        <Text style={styles.pinBtnText}>📌</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        hitSlop={6}
                        onPress={() => onTogglePinTaskbar(app.id)}
                        style={[styles.pinBtn, pinnedTaskbar.includes(app.id) && styles.pinBtnOn]}>
                        <Text style={styles.pinBtnText}>▭</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Pinned to Start (right) */}
              <View style={styles.startPinned}>
                <Text style={styles.startColLabel}>Pinned</Text>
                <ScrollView contentContainerStyle={styles.pinnedGrid}>
                  {pinned.length === 0 ? (
                    <Text style={styles.pinnedEmpty}>Tap 📌 to pin apps here.</Text>
                  ) : (
                    pinned.map(app => (
                      <TouchableOpacity
                        key={app.id}
                        style={styles.pinnedTile}
                        activeOpacity={0.75}
                        onPress={() => launch(app)}>
                        <Text style={styles.pinnedTileIcon}>{app.icon}</Text>
                        <Text style={styles.pinnedTileLabel} numberOfLines={1}>
                          {app.label}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>

            {/* Bottom row: settings wheel · files · power */}
            <View style={styles.menuDivider} />
            <View style={styles.startFooter}>
              <TouchableOpacity
                style={styles.footerBtn}
                onPress={() => {
                  onClose();
                  onOpenSettings();
                }}>
                <Text style={styles.footerGlyph}>⚙️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerBtn}
                onPress={() => {
                  onClose();
                  onOpenFiles();
                }}>
                <Text style={styles.footerGlyph}>🗂️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerBtn}
                onPress={() => {
                  onClose();
                  onPower();
                }}>
                <Text style={styles.footerGlyph}>⏻</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Small input dialog for naming new desktop folders.
const NameDialog: React.FC<{
  visible: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
}> = ({visible, onSubmit, onClose}) => {
  const [name, setName] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>New folder</Text>
          <TextInput
            style={styles.dialogInput}
            value={name}
            onChangeText={setName}
            placeholder="Folder name"
            placeholderTextColor="#8aa6c8"
            autoFocus
          />
          <View style={styles.dialogRow}>
            <TouchableOpacity style={styles.dialogBtn} onPress={onClose}>
              <Text style={styles.dialogBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogBtn, styles.dialogBtnPrimary]}
              onPress={() => {
                const clean = name.trim();
                if (clean) {
                  onSubmit(clean);
                  setName('');
                }
              }}>
              <Text style={styles.dialogBtnText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Live clock content for the clock widget.
const ClockWidgetContent: React.FC = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.clockWidget}>
      <Text style={styles.clockWidgetTime}>
        {now.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}
      </Text>
      <Text style={styles.clockWidgetDate}>
        {now.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
      </Text>
    </View>
  );
};

type WidgetKind = 'clock' | 'quickswitch' | 'notes';

interface DesktopWidgetSpec extends WidgetSpec {
  kind: WidgetKind;
}

let widgetCounter = 1;
let folderCounter = 1;

// Main App Component
const App: React.FC = () => {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [mveSettingsOpen, setMveSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [browserPickerOpen, setBrowserPickerOpen] = useState(false);
  const [icons, setIcons] = useState<IconSpec[]>(DEFAULT_ICONS);
  const [binned, setBinned] = useState<BinnedIcon[]>([]);
  const [widgets, setWidgets] = useState<DesktopWidgetSpec[]>([]);
  const [iconMenu, setIconMenu] = useState<IconSpec | null>(null);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [pinnedStart, setPinnedStart] = useState<string[]>(['internet', 'cmd', 'ghost-key']);
  const [pinnedTaskbar, setPinnedTaskbar] = useState<string[]>(['internet', 'file-explorer']);
  const [theme, setTheme] = useState(() => ThemeStore.theme());
  const pagerRef = useRef<ScrollView>(null);

  const togglePin = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) =>
    setter(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  useEffect(() => ThemeStore.subscribe(() => setTheme(ThemeStore.theme())), []);

  const toggleStartMenu = useCallback(() => {
    setStartMenuOpen(prev => !prev);
  }, []);

  const openWindow = useCallback((title: string) => {
    setOpenWindows(prev => (prev.includes(title) ? prev : [...prev, title]));
  }, []);

  const closeWindow = useCallback((title: string) => {
    setOpenWindows(prev => prev.filter(w => w !== title));
  }, []);

  // Summon MVE: snap the pager to the MVE page (left of home).
  const summonMve = useCallback(() => {
    pagerRef.current?.scrollTo({x: 0, animated: true});
  }, []);

  // Minimize the MVE wall: snap back to the home desktop (right page).
  const goHome = useCallback(() => {
    pagerRef.current?.scrollTo({x: SCREEN_WIDTH, animated: true});
  }, []);

  // Open intents drive the taskbar MVE pill (context-first surfacing).
  const [openIntents, setOpenIntents] = useState<Intent[]>([]);
  useEffect(
    () => ActionRegistry.subscribe(() => setOpenIntents(ActionRegistry.open())),
    [],
  );

  // System gesture: a right-fling from the left edge calls MVE up from anywhere.
  const summonGesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      runOnJS(summonMve)();
    });

  // Long-press on empty desktop → widgets / new folder / edit background.
  const openDesktopMenu = useCallback(() => setDesktopMenuOpen(true), []);
  const desktopLongPress = Gesture.LongPress()
    .minDuration(450)
    .onStart(() => {
      runOnJS(openDesktopMenu)();
    });

  // ── Icon actions ──
  const onIconPress = useCallback(
    (icon: IconSpec) => {
      switch (icon.id) {
        case 'neversoft':
          // Permanent brand icon → straight to the NeverSoft GitHub.
          openUrl(NEVERSOFT_GITHUB_URL);
          return;
        case 'ghost-key':
          // The legit NeverSoft (Ghost Key) file explorer — launch it if
          // installed, otherwise fetch the real APK.
          openAppOrStore(GHOST_KEY_PKG, GHOST_KEY_APK_URL);
          return;
        case 'file-explorer':
          // Shell icon → straight to file explorers on the Play Store.
          openPlayStoreSearch('file explorer');
          return;
        case 'internet':
          setBrowserPickerOpen(true);
          return;
        default:
          openWindow(icon.label);
      }
    },
    [openWindow],
  );

  const removeIcon = useCallback((icon: IconSpec) => {
    setIcons(prev => prev.filter(i => i.id !== icon.id));
    setBinned(prev => [...prev, {id: icon.id, label: icon.label, icon: icon.icon}]);
  }, []);

  const restoreIcon = useCallback(
    (id: string) => {
      setBinned(prev => prev.filter(b => b.id !== id));
      const original = DEFAULT_ICONS.find(i => i.id === id);
      setIcons(prev => {
        const fallback = binned.find(b => b.id === id);
        const spec =
          original ??
          (fallback ? {id: fallback.id, label: fallback.label, icon: fallback.icon} : null);
        return spec && !prev.some(i => i.id === id) ? [...prev, spec] : prev;
      });
    },
    [binned],
  );

  // ── Widgets ──
  const addWidget = useCallback((kind: WidgetKind) => {
    const id = `widget-${widgetCounter++}`;
    const base = {x: 24 + widgets.length * 24, y: 120 + widgets.length * 24};
    const spec: DesktopWidgetSpec =
      kind === 'clock'
        ? {id, kind, title: 'Clock', width: 170, height: 110, ...base}
        : kind === 'quickswitch'
          ? {id, kind, title: 'Aesthetic Quickswitch', width: 280, height: 320, ...base}
          : {id, kind, title: 'Notes', width: 220, height: 160, ...base};
    setWidgets(prev => [...prev, spec]);
  }, [widgets.length]);

  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }, []);

  const newFolder = useCallback((name: string) => {
    setFolderDialogOpen(false);
    setIcons(prev => [
      ...prev,
      {id: `folder-${folderCounter++}`, label: name, icon: '📁'},
    ]);
  }, []);

  // ── Menus ──
  const desktopMenuItems: MenuItem[] = [
    {label: 'Add widget — Clock', icon: '🕐', onPress: () => addWidget('clock')},
    {label: 'Add widget — Quickswitch', icon: '🎨', onPress: () => addWidget('quickswitch')},
    {label: 'Add widget — Notes', icon: '⬜', onPress: () => addWidget('notes')},
    {label: 'New folder', icon: '📁', onPress: () => setFolderDialogOpen(true)},
    {label: 'Edit background', icon: '🖼️', onPress: () => openWindow('Settings')},
  ];

  const iconMenuItems: MenuItem[] = iconMenu
    ? [
        {
          label: 'App settings',
          icon: '⚙️',
          onPress: () =>
            iconMenu.pkg ? openPlayStore(iconMenu.pkg) : openWindow('Settings'),
        },
        // Permanent fixtures (e.g. the NeverSoft brand icon) can't be removed.
        ...(iconMenu.permanent
          ? []
          : [
              {
                label: 'Remove from desktop',
                icon: '🗑️',
                danger: true,
                onPress: () => removeIcon(iconMenu),
              },
            ]),
      ]
    : [];

  // ── Window content router ──
  const renderWindowContent = (title: string) => {
    switch (title) {
      case 'Recycle Bin':
        return (
          <RecycleBin
            items={binned}
            onRestore={restoreIcon}
            onEmpty={() => setBinned([])}
          />
        );
      case 'cmd':
        return <Terminal />;
      case 'Google':
        return <FolderWindow apps={GOOGLE_APPS} />;
      case 'Microsoft':
        return <FolderWindow apps={MICROSOFT_APPS} />;
      case 'Settings':
        return (
          <ScrollView contentContainerStyle={styles.settingsContent}>
            <QuickswitchBox />
          </ScrollView>
        );
      default: {
        const folder = icons.find(i => i.label === title && i.id.startsWith('folder-'));
        if (folder) {
          return (
            <FolderWindow
              apps={[]}
              emptyHint="Empty folder — shell icons you add will appear here."
            />
          );
        }
        return (
          <View style={styles.windowContent}>
            <Text style={styles.windowText}>{title} Content</Text>
          </View>
        );
      }
    }
  };

  const windowSize = (title: string): {width: number; height: number} => {
    switch (title) {
      case 'cmd':
        return {width: Math.min(SCREEN_WIDTH - 24, 380), height: 440};
      case 'Recycle Bin':
        return {width: 330, height: 380};
      case 'Settings':
        return {width: 330, height: 430};
      case 'Google':
      case 'Microsoft':
        return {width: 330, height: 320};
      default:
        return {width: 320, height: 240};
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
    <ErrorBoundary>
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.gradient[2]} />

      {/* Themed Aero background — switches live with the design catalog */}
      <LinearGradient
        colors={theme.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />

      {/* Horizontal pager: MVE page sits to the LEFT of the home desktop.
          Starts on the home page; swipe left to reach the MVE engine. */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
        contentOffset={{x: SCREEN_WIDTH, y: 0}}
        onLayout={() =>
          pagerRef.current?.scrollTo({x: SCREEN_WIDTH, animated: false})
        }>
        {/* MVE page — chat + Linux sandbox */}
        <View style={styles.page}>
          <MveScreen onMinimize={goHome} />
        </View>

        {/* Home desktop */}
        <View style={styles.page}>
          <View style={styles.desktop}>
            {/* Long-press surface for the empty desktop (behind the icons) */}
            <GestureDetector gesture={desktopLongPress}>
              <View style={StyleSheet.absoluteFill} />
            </GestureDetector>

            {/* Desktop Icons */}
            <View style={styles.iconGrid}>
              {icons.map(icon => (
                <DesktopIcon
                  key={icon.id}
                  label={icon.label}
                  icon={icon.icon}
                  badge={icon.badge}
                  onPress={() => onIconPress(icon)}
                  onLongPress={() => setIconMenu(icon)}
                />
              ))}
            </View>

            {/* Widgets layer */}
            {widgets.map(w => (
              <DesktopWidget key={w.id} spec={w} onRemove={removeWidget}>
                {w.kind === 'clock' ? (
                  <ClockWidgetContent />
                ) : w.kind === 'quickswitch' ? (
                  <ScrollView contentContainerStyle={styles.widgetScroll}>
                    <QuickswitchBox />
                  </ScrollView>
                ) : (
                  <TextInput
                    style={styles.notesInput}
                    multiline
                    placeholder="Type here…"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                  />
                )}
              </DesktopWidget>
            ))}

            {/* Open Windows */}
            {openWindows.map((title, index) => {
              const size = windowSize(title);
              return (
                <WindowFrame
                  key={title}
                  title={title}
                  width={size.width}
                  height={size.height}
                  x={24 + index * 20}
                  y={40 + index * 20}
                  resizable
                  onClose={() => closeWindow(title)}>
                  {renderWindowContent(title)}
                </WindowFrame>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Start Menu — real app drawer with pin-to-Start / pin-to-taskbar */}
      <StartMenu
        visible={startMenuOpen}
        onClose={() => setStartMenuOpen(false)}
        apps={icons}
        onLaunch={onIconPress}
        pinnedStart={pinnedStart}
        onTogglePinStart={togglePin(setPinnedStart)}
        pinnedTaskbar={pinnedTaskbar}
        onTogglePinTaskbar={togglePin(setPinnedTaskbar)}
        onOpenSettings={() => openWindow('Settings')}
        onOpenFiles={() => openWindow('Computer')}
        onPower={() => BackHandler.exitApp()}
      />

      {/* MVE Settings (opened from the start menu) */}
      <Modal
        visible={mveSettingsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMveSettingsOpen(false)}>
        <View style={styles.mveModalOverlay}>
          <MveSettingsScreen onClose={() => setMveSettingsOpen(false)} />
        </View>
      </Modal>

      {/* Left-edge summon strip: right-fling here calls MVE up. */}
      <GestureDetector gesture={summonGesture}>
        <View style={styles.summonEdge} pointerEvents="box-only" />
      </GestureDetector>

      {/* Taskbar — start orb, pinned quick-launch, clock → notification popup */}
      <Taskbar
        height={48}
        startOrbComponent={
          <StartOrb size={40} onPress={toggleStartMenu} />
        }
        quickLaunchItems={pinnedTaskbar
          .map(id => icons.find(i => i.id === id))
          .filter((a): a is IconSpec => !!a)
          .map(app => (
            <TouchableOpacity
              key={app.id}
              style={styles.taskQuick}
              activeOpacity={0.7}
              onPress={() => onIconPress(app)}>
              <Text style={styles.taskQuickIcon}>{app.icon}</Text>
            </TouchableOpacity>
          ))}
        showClock={true}
        onClockPress={() => setNotifOpen(true)}
      />

      {/* MVE intent pill: open-task count, tap to summon MVE. */}
      <TouchableOpacity
        style={[styles.mvePill, {backgroundColor: theme.accent + 'aa'}]}
        onPress={summonMve}
        activeOpacity={0.8}>
        <Text style={styles.mvePillText}>
          ◎ MVE{openIntents.length ? ` · ${openIntents.length}` : ''}
        </Text>
      </TouchableOpacity>

      {/* Popups */}
      <NotificationCenter visible={notifOpen} onClose={() => setNotifOpen(false)} />
      <BrowserPicker
        visible={browserPickerOpen}
        onClose={() => setBrowserPickerOpen(false)}
      />
      <GlassMenu
        visible={desktopMenuOpen}
        title="Desktop"
        items={desktopMenuItems}
        onClose={() => setDesktopMenuOpen(false)}
      />
      <GlassMenu
        visible={iconMenu != null}
        title={iconMenu?.label}
        items={iconMenuItems}
        onClose={() => setIconMenu(null)}
      />
      <NameDialog
        visible={folderDialogOpen}
        onSubmit={newFolder}
        onClose={() => setFolderDialogOpen(false)}
      />
    </SafeAreaView>
    </ErrorBoundary>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  summonEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 48,
    width: 16,
  },
  mvePill: {
    position: 'absolute',
    right: 12,
    bottom: 56,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  mvePillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  page: {
    width: SCREEN_WIDTH,
  },
  mveModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  desktop: {
    flex: 1,
    padding: 16,
    paddingBottom: 64, // Space for taskbar
  },
  // Classic Windows desktop: icons flow top-to-bottom in a left column, then
  // wrap into the next column — not a grid spread across the screen.
  iconGrid: {
    flex: 1,
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
  desktopIcon: {
    width: 80,
    height: 86,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4,
    marginRight: 8,
    gap: 4,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  iconText: {
    fontSize: 24,
    color: '#dffbe0',
    fontWeight: '700',
  },
  iconBadgeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 9, // sit on the folder's face, below the tab
  },
  iconBadge: {
    color: '#e3262f',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255,255,255,0.65)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 1,
  },
  iconLabel: {
    width: 78,
    fontSize: 11,
    lineHeight: 13,
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
    textAlign: 'center',
  },
  // ── Start menu (app drawer) ──
  startOverlay: {flex: 1, justifyContent: 'flex-end'},
  startMenu: {
    height: '76%',
    marginBottom: 48, // sit above the taskbar
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 16,
  },
  startGradient: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  startMenuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginVertical: 6,
  },
  startBody: {flex: 1, flexDirection: 'row', gap: 10},
  startApps: {flex: 1.25},
  startPinned: {flex: 1},
  startColLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
    paddingLeft: 4,
  },
  startAppsScroll: {flex: 1},
  appRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 3, gap: 6},
  appRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  appRowIcon: {fontSize: 18, width: 24, textAlign: 'center', color: '#dffbe0'},
  appRowLabel: {color: '#eaf4ff', fontSize: 14, flex: 1},
  pinBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pinBtnOn: {
    backgroundColor: 'rgba(120,170,235,0.5)',
    borderColor: 'rgba(150,200,255,0.7)',
  },
  pinBtnText: {fontSize: 12},
  pinnedGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  pinnedEmpty: {color: 'rgba(255,255,255,0.5)', fontSize: 12, fontStyle: 'italic'},
  pinnedTile: {
    width: 70,
    height: 70,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pinnedTileIcon: {fontSize: 24},
  pinnedTileLabel: {color: '#fff', fontSize: 10, textAlign: 'center', paddingHorizontal: 2},
  startFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerBtn: {
    width: 54,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  footerGlyph: {fontSize: 22},
  taskQuick: {
    width: 34,
    height: 34,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  taskQuickIcon: {fontSize: 16},
  windowContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  windowText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  settingsContent: {
    padding: 12,
  },
  widgetScroll: {
    padding: 6,
  },
  notesInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    padding: 8,
    textAlignVertical: 'top',
  },
  clockWidget: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockWidgetTime: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '300',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  clockWidgetDate: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    backgroundColor: 'rgba(28,42,66,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    padding: 16,
    gap: 12,
  },
  dialogTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dialogInput: {
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  dialogRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  dialogBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dialogBtnPrimary: {
    backgroundColor: 'rgba(120,170,235,0.55)',
  },
  dialogBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default App;
