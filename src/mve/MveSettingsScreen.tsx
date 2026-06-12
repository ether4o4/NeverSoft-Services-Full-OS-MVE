/**
 * MveSettingsScreen — MVE engine settings, macOS "System Settings" look.
 *
 * Providers: enable + API key with an explicit Save button.
 * Local model: pick an on-device model (runs locally once the MorsVitaEst
 *   engine is linked; until then it's a saved preference).
 * System: Linux sandbox + 24/7 daemon toggles.
 */
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MveBridge, ServiceInstance, isNative } from './MveBridge';
import { LOCAL_MODELS, MveSettings } from './mveSettings';

const MveSettingsScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [services, setServices] = useState<ServiceInstance[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [sandbox, setSandbox] = useState(false);
  const [daemon, setDaemon] = useState(false);
  const [local, setLocal] = useState(() => MveSettings.get());

  useEffect(() => MveSettings.subscribe(() => setLocal(MveSettings.get())), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [svc, sb, dm] = await Promise.all([
        MveBridge.services(),
        MveBridge.isSandboxEnabled(),
        MveBridge.isDaemonEnabled(),
      ]);
      if (cancelled) return;
      setServices(svc);
      setSandbox(sb);
      setDaemon(dm);
      const loaded: Record<string, string> = {};
      await Promise.all(
        svc.map(async s => {
          loaded[s.instanceId] = await MveBridge.getApiKey(s.instanceId);
        }),
      );
      if (!cancelled) setKeys(loaded);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleService = async (s: ServiceInstance, enabled: boolean) => {
    setServices(prev => prev.map(x => (x.instanceId === s.instanceId ? { ...x, enabled } : x)));
    await MveBridge.setServiceEnabled(s.instanceId, enabled);
  };

  const saveKey = async (instanceId: string) => {
    await MveBridge.setApiKey(instanceId, keys[instanceId] ?? '');
    setSaved(prev => ({ ...prev, [instanceId]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [instanceId]: false })), 1600);
  };

  return (
    <View style={styles.panel}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>System Settings</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeX}>✕</Text>
        </TouchableOpacity>
      </View>

      {!isNative && <Text style={styles.banner}>Engine not linked — settings save locally</Text>}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Local model ── */}
        <Text style={styles.section}>Local Model (on-device)</Text>
        <View style={styles.group}>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>Use a local model</Text>
              <Text style={styles.rowHint}>Run a model entirely on your phone — no network</Text>
            </View>
            <Switch value={local.localEnabled} onValueChange={MveSettings.setLocalEnabled} />
          </View>
          {LOCAL_MODELS.map((m, i) => {
            const active = local.localModelId === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.row, i < LOCAL_MODELS.length - 1 && styles.rowBorder]}
                activeOpacity={0.7}
                onPress={() => MveSettings.setLocalModel(active ? null : m.id)}>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{m.name}</Text>
                  <Text style={styles.rowHint}>{m.params} · {m.size} · {m.note}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioOn]}>
                  {active && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {local.localEnabled && local.localModelId && (
          <Text style={styles.note}>
            {MveSettings.activeModel()?.name} selected — runs on-device once the MVE engine is linked.
          </Text>
        )}

        {/* ── Providers + API keys ── */}
        <Text style={styles.section}>Providers</Text>
        {services.map(s => (
          <View key={s.instanceId} style={styles.group}>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{s.displayName}</Text>
              <Switch value={s.enabled} onValueChange={v => toggleService(s, v)} />
            </View>
            <View style={styles.keyRow}>
              <TextInput
                style={styles.keyInput}
                value={keys[s.instanceId] ?? ''}
                onChangeText={t => setKeys(prev => ({ ...prev, [s.instanceId]: t }))}
                placeholder="API key"
                placeholderTextColor="#9aa3ad"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.saveBtn, saved[s.instanceId] && styles.saveBtnDone]}
                onPress={() => saveKey(s.instanceId)}>
                <Text style={styles.saveBtnText}>{saved[s.instanceId] ? 'Saved ✓' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {services.length === 0 && <Text style={styles.note}>No providers configured yet.</Text>}

        {/* ── System ── */}
        <Text style={styles.section}>System</Text>
        <View style={styles.group}>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>Linux sandbox</Text>
              <Text style={styles.rowHint}>Embedded shell, files, package manager</Text>
            </View>
            <Switch
              value={sandbox}
              onValueChange={async v => {
                setSandbox(v);
                await MveBridge.setSandboxEnabled(v);
              }}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>Daemon (24/7)</Text>
              <Text style={styles.rowHint}>Keep the engine running for tasks & heartbeat</Text>
            </View>
            <Switch
              value={daemon}
              onValueChange={async v => {
                setDaemon(v);
                await MveBridge.setDaemonEnabled(v);
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    width: '92%',
    maxWidth: 460,
    maxHeight: '84%',
    backgroundColor: '#f2f2f5',
    borderRadius: 14,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#e7e7ec',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c9c9cf',
  },
  title: { color: '#1c1c1e', fontSize: 17, fontWeight: '700' },
  closeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff5f57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: { color: 'rgba(0,0,0,0.5)', fontSize: 11, fontWeight: '700' },
  banner: {
    color: '#8a6d00',
    backgroundColor: '#fff3cd',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 4,
  },
  scroll: { padding: 16, gap: 8 },
  section: {
    color: '#6e6e73',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 2,
    paddingLeft: 4,
  },
  group: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e4' },
  rowTitle: { color: '#1c1c1e', fontSize: 15, fontWeight: '500' },
  rowHint: { color: '#8a8a8e', fontSize: 12, marginTop: 1 },
  flex: { flex: 1, paddingRight: 12 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#c0c0c6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: '#0a84ff' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#0a84ff' },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  keyInput: {
    flex: 1,
    color: '#1c1c1e',
    backgroundColor: '#f0f0f3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#0a84ff',
  },
  saveBtnDone: { backgroundColor: '#34c759' },
  saveBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  note: { color: '#6e6e73', fontSize: 12, fontStyle: 'italic', paddingHorizontal: 4 },
});

export default MveSettingsScreen;
