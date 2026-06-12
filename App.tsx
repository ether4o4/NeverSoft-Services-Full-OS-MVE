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
import LinearGradient from 'react-native-linear-gradient';

// macOS shell
import MenuBar from './src/macos/MenuBar';
import Dock from './src/macos/Dock';
import Launchpad from './src/macos/Launchpad';
import FinderWindow from './src/macos/FinderWindow';
import {MacApp} from './src/macos/apps';

import {WindowFrame} from './src/components/glass';

// Desktop pieces
import ErrorBoundary from './src/ErrorBoundary';
import {ThemeStore} from './src/theme/themes';
import GlassMenu, {MenuItem} from './src/desktop/GlassMenu';
import DesktopWidget, {WidgetSpec} from './src/desktop/DesktopWidget';
import NotificationCenter, {QuickswitchBox} from './src/desktop/NotificationCenter';
import Terminal from './src/desktop/Terminal';
import RecycleBin, {BinnedIcon} from './src/desktop/RecycleBin';
import BrowserPicker from './src/desktop/BrowserPicker';
import FolderWindow from './src/desktop/FolderWindow';

// MVE
import MveScreen from './src/mve/MveScreen';
import MveSettingsScreen from './src/mve/MveSettingsScreen';

import {
  GOOGLE_APPS,
  MICROSOFT_APPS,
  GHOST_KEY_PKG,
  GHOST_KEY_APK_URL,
  NEVERSOFT_GITHUB_URL,
  openAppOrStore,
  openPlayStoreSearch,
  openUrl,
} from './src/desktop/storeLinks';

const NS_AVATAR = require('./src/assets/ns-avatar.jpg');
const {width: SCREEN_WIDTH} = Dimensions.get('window');

// Name dialog for new desktop folders.
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
          <Text style={styles.dialogTitle}>New Folder</Text>
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

const App: React.FC = () => {
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [mveSettingsOpen, setMveSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [browserPickerOpen, setBrowserPickerOpen] = useState(false);
  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const [appleMenuOpen, setAppleMenuOpen] = useState(false);
  const [binned, setBinned] = useState<BinnedIcon[]>([]);
  const [widgets, setWidgets] = useState<DesktopWidgetSpec[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [theme, setTheme] = useState(() => ThemeStore.theme());
  const pagerRef = useRef<ScrollView>(null);

  useEffect(() => ThemeStore.subscribe(() => setTheme(ThemeStore.theme())), []);

  const openWindow = useCallback((title: string) => {
    setOpenWindows(prev => (prev.includes(title) ? prev : [...prev, title]));
  }, []);
  const closeWindow = useCallback((title: string) => {
    setOpenWindows(prev => prev.filter(w => w !== title));
  }, []);

  const summonMve = useCallback(() => {
    pagerRef.current?.scrollTo({x: 0, animated: true});
  }, []);
  const goHome = useCallback(() => {
    pagerRef.current?.scrollTo({x: SCREEN_WIDTH, animated: true});
  }, []);

  const summonGesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => runOnJS(summonMve)());

  const openDesktopMenu = useCallback(() => setDesktopMenuOpen(true), []);
  const desktopLongPress = Gesture.LongPress()
    .minDuration(450)
    .onStart(() => runOnJS(openDesktopMenu)());

  // ── Launch an app ──
  const onAppPress = useCallback(
    (app: MacApp) => {
      switch (app.id) {
        case 'finder':
          return openWindow('Finder');
        case 'safari':
          return setBrowserPickerOpen(true);
        case 'messages':
          return summonMve();
        case 'music':
          return openWindow('Music');
        case 'photos':
          return openWindow('Photos');
        case 'terminal':
          return openWindow('Terminal');
        case 'ghost-key':
          return openAppOrStore(GHOST_KEY_PKG, GHOST_KEY_APK_URL);
        case 'neversoft':
          return openUrl(NEVERSOFT_GITHUB_URL);
        case 'google':
          return openWindow('Google');
        case 'microsoft':
          return openWindow('Microsoft');
        case 'settings':
          return setMveSettingsOpen(true);
        case 'launchpad':
          return setLaunchpadOpen(true);
        case 'trash':
          return openWindow('Trash');
        default:
          openWindow(app.name);
      }
    },
    [openWindow, summonMve],
  );

  // ── Widgets / folders ──
  const addWidget = useCallback(
    (kind: WidgetKind) => {
      const id = `widget-${widgetCounter++}`;
      const base = {x: 24 + widgets.length * 24, y: 70 + widgets.length * 24};
      const spec: DesktopWidgetSpec =
        kind === 'clock'
          ? {id, kind, title: 'Clock', width: 170, height: 110, ...base}
          : kind === 'quickswitch'
            ? {id, kind, title: 'Appearance', width: 280, height: 320, ...base}
            : {id, kind, title: 'Notes', width: 220, height: 160, ...base};
      setWidgets(prev => [...prev, spec]);
    },
    [widgets.length],
  );
  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }, []);
  const newFolder = useCallback((name: string) => {
    setFolderDialogOpen(false);
    setFolders(prev => [...prev, name]);
    openWindow(name);
  }, [openWindow]);

  const desktopMenuItems: MenuItem[] = [
    {label: 'New Folder', icon: '📁', onPress: () => setFolderDialogOpen(true)},
    {label: 'Add Widget — Clock', icon: '🕐', onPress: () => addWidget('clock')},
    {label: 'Add Widget — Appearance', icon: '🎨', onPress: () => addWidget('quickswitch')},
    {label: 'Add Widget — Notes', icon: '⬜', onPress: () => addWidget('notes')},
    {label: 'Change Wallpaper', icon: '🖼️', onPress: () => openWindow('Appearance')},
  ];

  const appleMenuItems: MenuItem[] = [
    {label: 'About This Mac', icon: '', onPress: () => openWindow('About')},
    {label: 'System Settings…', icon: '⚙️', onPress: () => setMveSettingsOpen(true)},
    {label: 'Appearance…', icon: '🎨', onPress: () => openWindow('Appearance')},
    {label: 'Sleep', icon: '🌙', onPress: () => {}},
    {label: 'Restart', icon: '↻', onPress: () => {}},
    {label: 'Shut Down', icon: '⏻', danger: true, onPress: () => BackHandler.exitApp()},
  ];

  // ── Window content ──
  const renderWindowContent = (title: string) => {
    switch (title) {
      case 'Finder':
        return <FinderWindow start="Recents" />;
      case 'Music':
        return <FinderWindow start="Recents" />;
      case 'Photos':
        return <FinderWindow start="Recents" />;
      case 'Terminal':
        return <Terminal />;
      case 'Trash':
        return <RecycleBin items={binned} onRestore={() => {}} onEmpty={() => setBinned([])} />;
      case 'Google':
        return <FolderWindow apps={GOOGLE_APPS} />;
      case 'Microsoft':
        return <FolderWindow apps={MICROSOFT_APPS} />;
      case 'Appearance':
        return (
          <ScrollView style={styles.lightWin} contentContainerStyle={styles.settingsContent}>
            <QuickswitchBox />
          </ScrollView>
        );
      case 'About':
        return (
          <View style={styles.aboutWin}>
            <Text style={styles.aboutTitle}>NeverSoft Services</Text>
            <Text style={styles.aboutLine}>NSOS 1.0 · 2026</Text>
            <Text style={styles.aboutLine}>The last launcher you'll ever need.</Text>
          </View>
        );
      default:
        if (folders.includes(title)) {
          return <FinderWindow start="Recents" />;
        }
        return (
          <View style={styles.windowContent}>
            <Text style={styles.windowText}>{title}</Text>
          </View>
        );
    }
  };

  const windowSize = (title: string): {width: number; height: number} => {
    switch (title) {
      case 'Terminal':
        return {width: Math.min(SCREEN_WIDTH - 24, 400), height: 440};
      case 'Finder':
      case 'Music':
      case 'Photos':
        return {width: Math.min(SCREEN_WIDTH - 20, 380), height: 420};
      case 'Trash':
        return {width: 330, height: 380};
      case 'Appearance':
        return {width: 330, height: 430};
      case 'About':
        return {width: 280, height: 200};
      case 'Google':
      case 'Microsoft':
        return {width: 330, height: 320};
      default:
        return {width: 320, height: 240};
    }
  };

  const runningIds = openWindows
    .map(t => t.toLowerCase())
    .reduce<string[]>((acc, t) => {
      if (t === 'finder') acc.push('finder');
      if (t === 'terminal') acc.push('terminal');
      if (t === 'trash') acc.push('trash');
      if (t === 'music') acc.push('music');
      return acc;
    }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={theme.gradient[2]} />
          <LinearGradient
            colors={theme.gradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={StyleSheet.absoluteFill}
          />

          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.pager}
            contentOffset={{x: SCREEN_WIDTH, y: 0}}
            onLayout={() => pagerRef.current?.scrollTo({x: SCREEN_WIDTH, animated: false})}>
            {/* MVE page */}
            <View style={styles.page}>
              <MveScreen onMinimize={goHome} />
            </View>

            {/* Home desktop */}
            <View style={styles.page}>
              <View style={styles.desktop}>
                <GestureDetector gesture={desktopLongPress}>
                  <View style={StyleSheet.absoluteFill} />
                </GestureDetector>

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

                {openWindows.map((title, index) => {
                  const size = windowSize(title);
                  const isTerminal = title === 'Terminal';
                  return (
                    <WindowFrame
                      key={title}
                      title={isTerminal ? 'Terminal — zsh' : title}
                      dark={isTerminal}
                      width={size.width}
                      height={size.height}
                      x={20 + index * 22}
                      y={44 + index * 22}
                      resizable
                      onClose={() => closeWindow(title)}>
                      {renderWindowContent(title)}
                    </WindowFrame>
                  );
                })}

                {/* macOS menu bar + dock */}
                <MenuBar
                  onApple={() => setAppleMenuOpen(true)}
                  onClockPress={() => setNotifOpen(true)}
                />
                <Dock onAppPress={onAppPress} running={runningIds} neverSoftImage={NS_AVATAR} />
              </View>
            </View>
          </ScrollView>

          {/* Left-edge summon strip */}
          <GestureDetector gesture={summonGesture}>
            <View style={styles.summonEdge} pointerEvents="box-only" />
          </GestureDetector>

          {/* Overlays */}
          <Launchpad
            visible={launchpadOpen}
            onClose={() => setLaunchpadOpen(false)}
            onAppPress={onAppPress}
            neverSoftImage={NS_AVATAR}
          />
          <Modal
            visible={mveSettingsOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setMveSettingsOpen(false)}>
            <View style={styles.mveModalOverlay}>
              <MveSettingsScreen onClose={() => setMveSettingsOpen(false)} />
            </View>
          </Modal>
          <NotificationCenter visible={notifOpen} onClose={() => setNotifOpen(false)} />
          <BrowserPicker visible={browserPickerOpen} onClose={() => setBrowserPickerOpen(false)} />
          <GlassMenu
            visible={appleMenuOpen}
            title="NeverSoft"
            items={appleMenuItems}
            onClose={() => setAppleMenuOpen(false)}
          />
          <GlassMenu
            visible={desktopMenuOpen}
            title="Desktop"
            items={desktopMenuItems}
            onClose={() => setDesktopMenuOpen(false)}
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
  root: {flex: 1},
  container: {flex: 1},
  pager: {flex: 1},
  page: {width: SCREEN_WIDTH},
  desktop: {flex: 1},
  summonEdge: {position: 'absolute', left: 0, top: 28, bottom: 80, width: 16},
  mveModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  windowContent: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#f5f5f7'},
  windowText: {fontSize: 16, color: '#1c1c1e'},
  lightWin: {flex: 1, backgroundColor: 'rgba(28,42,66,0.96)'},
  settingsContent: {padding: 12},
  aboutWin: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16, backgroundColor: '#f5f5f7'},
  aboutTitle: {fontSize: 18, fontWeight: '700', color: '#1c1c1e'},
  aboutLine: {fontSize: 12, color: '#6e6e73'},
  widgetScroll: {padding: 6},
  notesInput: {flex: 1, color: '#ffffff', fontSize: 13, padding: 8, textAlignVertical: 'top'},
  clockWidget: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  clockWidgetTime: {color: '#ffffff', fontSize: 28, fontWeight: '300'},
  clockWidgetDate: {color: 'rgba(255,255,255,0.75)', fontSize: 12},
  dialogBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24},
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
  dialogTitle: {color: '#ffffff', fontSize: 16, fontWeight: '700'},
  dialogInput: {color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14},
  dialogRow: {flexDirection: 'row', justifyContent: 'flex-end', gap: 8},
  dialogBtn: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)'},
  dialogBtnPrimary: {backgroundColor: 'rgba(120,170,235,0.55)'},
  dialogBtnText: {color: '#ffffff', fontSize: 13, fontWeight: '600'},
});

export default App;
