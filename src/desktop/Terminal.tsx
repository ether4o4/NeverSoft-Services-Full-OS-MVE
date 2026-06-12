/**
 * Terminal — the cmd window. Styled like the classic Windows Command Prompt
 * (pure black, white monospace, `C:\>` prompt) but every command runs for real
 * through the MVE sandbox shell (MveBridge.run). The assistant uses the same
 * path — `$ <command>` in chat runs here too.
 *
 * `clear` wipes the screen, `find: <keyword>` searches sandbox files.
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MveBridge } from '../mve/MveBridge';

export const SHELL_PROMPT = 'C:\\>';

interface Block {
  id: number;
  cmd: string;
  output: string;
  error?: boolean;
  running?: boolean;
}

let nextBlockId = 1;

/** Run a command through the sandbox shell — shared with the assistant. */
export async function runShell(cmd: string): Promise<string> {
  if (cmd.startsWith('find:')) {
    const keyword = cmd.slice('find:'.length).trim();
    const hits = await MveBridge.searchFilenames('/root', keyword);
    return hits.length ? hits.join('\n') : '(no matching files)';
  }
  return MveBridge.run(cmd);
}

const Terminal: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: 0,
      cmd: '',
      output:
        'NeverSoft Services [Version 10.0.NSOS]\n' +
        '(c) NeverSoft Services. All rights reserved.\n',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<Block>>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const submit = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd || busy) return;
    setInput('');

    if (cmd === 'clear' || cmd === 'cls') {
      setBlocks([]);
      return;
    }

    const id = nextBlockId++;
    setBlocks(prev => [...prev, { id, cmd, output: '', running: true }]);
    setBusy(true);
    scrollToEnd();
    try {
      const out = await runShell(cmd);
      setBlocks(prev =>
        prev.map(b => (b.id === id ? { ...b, output: out || '', running: false } : b)),
      );
    } catch (e) {
      setBlocks(prev =>
        prev.map(b =>
          b.id === id ? { ...b, output: String(e), error: true, running: false } : b,
        ),
      );
    } finally {
      setBusy(false);
      scrollToEnd();
    }
  }, [input, busy, scrollToEnd]);

  return (
    <View style={styles.body}>
      <FlatList
        ref={listRef}
        data={blocks}
        keyExtractor={b => String(b.id)}
        contentContainerStyle={styles.content}
        onContentSizeChange={scrollToEnd}
        renderItem={({ item }) => (
          <View style={styles.block}>
            {item.cmd ? (
              <Text style={styles.line}>
                <Text style={styles.prompt}>{SHELL_PROMPT}</Text>
                <Text style={styles.cmd}>{item.cmd}</Text>
              </Text>
            ) : null}
            {item.running ? (
              <Text style={styles.line}>…</Text>
            ) : item.output ? (
              <Text style={[styles.line, item.error && styles.error]}>{item.output}</Text>
            ) : null}
          </View>
        )}
      />
      {busy && <ActivityIndicator color="#cccccc" style={styles.spinner} />}
      <View style={styles.inputRow}>
        <Text style={styles.prompt}>{SHELL_PROMPT}</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder=""
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={submit}
          blurOnSubmit={false}
          cursorColor="#f0f0f0"
        />
        <TouchableOpacity style={styles.runBtn} onPress={submit} disabled={busy}>
          <Text style={styles.runBtnText}>↵</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#0c0c0c' },
  content: { padding: 10 },
  block: {},
  line: {
    color: '#f0f0f0',
    fontFamily: MONO,
    fontSize: 13,
    lineHeight: 19,
  },
  prompt: { color: '#f0f0f0', fontFamily: MONO, fontSize: 13 },
  cmd: { color: '#f0f0f0', fontFamily: MONO, fontSize: 13 },
  error: { color: '#ff8a8a' },
  spinner: { position: 'absolute', right: 12, bottom: 56 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 8,
    backgroundColor: '#0c0c0c',
  },
  input: {
    flex: 1,
    color: '#f0f0f0',
    fontFamily: MONO,
    fontSize: 13,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  runBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runBtnText: { color: '#888888', fontSize: 15, fontWeight: '700' },
});

export default Terminal;
