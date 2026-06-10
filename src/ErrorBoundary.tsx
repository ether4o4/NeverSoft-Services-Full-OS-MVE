/**
 * ErrorBoundary — catches any error thrown during render/mount and shows it
 * on screen instead of letting the release build close instantly. This is our
 * diagnostic net: if the app dies at startup, the message + stack show up here
 * so we can see the real cause without a logcat.
 *
 * Note: this only catches JavaScript errors. A native crash (e.g. a Skia
 * SIGABRT) can't be caught here — if the app STILL closes instantly with no
 * red screen, the failure is native, not JS.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
  componentStack: string | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    this.setState({ componentStack: info?.componentStack ?? null });
  }

  render() {
    const { error, componentStack } = this.state;
    if (error) {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>⚠️ Startup error</Text>
          <Text selectable style={styles.message}>
            {String(error.message || error)}
          </Text>
          {error.stack ? (
            <Text selectable style={styles.stack}>
              {error.stack}
            </Text>
          ) : null}
          {componentStack ? (
            <Text selectable style={styles.stack}>
              {componentStack}
            </Text>
          ) : null}
        </ScrollView>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11151c' },
  content: { padding: 20, paddingTop: 60 },
  title: { color: '#ff8a8a', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  message: { color: '#ffffff', fontSize: 14, fontWeight: '600', marginBottom: 16 },
  stack: {
    color: '#9db8d6',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
    marginBottom: 16,
  },
});
