import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { createAppFailure, failureDetails, recordAppFailure, type AppFailure } from '../utils/appErrors';
import { listenForRuntimeErrors } from '../utils/runtimeErrors';

interface Props {
  children: React.ReactNode;
  screen: string;
  root?: boolean;
  onHome?: () => void | Promise<void>;
  onRetry?: () => void | Promise<void>;
  onSignIn?: () => void | Promise<void>;
  homeLabel?: string;
}
interface State {
  failure: AppFailure | null;
  generation: number;
  busy: boolean;
}

/** Plain native controls keep recovery independent of navigation, icons and app styling. */
export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { failure: null, generation: 0, busy: false };
  private stopListening?: () => void;
  private mounted = false;

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { failure: createAppFailure(error, 'SCREEN', 'Application'), busy: false };
  }

  componentDidCatch(_error: unknown, info: React.ErrorInfo): void {
    if (!this.state.failure) return;
    const failure = createAppFailure({
      message: this.state.failure.message,
      stack: [this.state.failure.stack, info.componentStack].filter(Boolean).join('\n'),
    }, this.props.root ? 'STARTUP' : 'SCREEN', this.props.screen);
    recordAppFailure(failure);
    this.setState({ failure });
  }

  componentDidMount(): void {
    this.mounted = true;
    if (this.props.root) {
      this.stopListening = listenForRuntimeErrors((failure) => this.setState({ failure, busy: false }));
    }
  }

  componentWillUnmount(): void {
    this.mounted = false;
    this.stopListening?.();
  }

  private recover = async (action?: () => void | Promise<void>) => {
    if (this.state.busy) return;
    this.setState({ busy: true });
    try {
      await action?.();
      if (this.mounted) this.setState(({ generation }) => ({ failure: null, generation: generation + 1, busy: false }));
    } catch (error) {
      const failure = createAppFailure(error, 'RUNTIME', 'Recovery');
      recordAppFailure(failure);
      if (this.mounted) this.setState({ failure, busy: false });
    }
  };

  render() {
    const { failure, busy, generation } = this.state;
    if (!failure) return <React.Fragment key={generation}>{this.props.children}</React.Fragment>;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.card} accessibilityLiveRegion="polite">
          <Text accessibilityRole="header" style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>We couldn’t open this screen. Try again or return to the dashboard. If this keeps happening, share the error details with support.</Text>
          <Text selectable style={styles.reference}>Error code: {failure.reference}</Text>
          <Pressable accessibilityRole="button" disabled={busy} style={styles.primary} onPress={() => { void this.recover(this.props.onHome ?? this.props.onRetry); }}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{this.props.onHome ? (this.props.homeLabel ?? 'Back to dashboard') : 'Try again'}</Text>}
          </Pressable>
          {this.props.onHome ? (
            <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={() => { void this.recover(this.props.onRetry); }}>
              <Text style={styles.secondaryText}>Try this screen again</Text>
            </Pressable>
          ) : null}
          {this.props.onSignIn ? (
            <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={() => { void this.recover(this.props.onSignIn); }}>
              <Text style={styles.secondaryText}>Sign in again</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => { void Share.share({ message: failureDetails(failure) }).catch(() => {}); }}>
            <Text style={styles.secondaryText}>Share error details</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 56 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 24, padding: 24, backgroundColor: '#FFFFFF' },
  title: { color: '#0F172A', fontSize: 24, fontWeight: '700', marginBottom: 12 },
  body: { color: '#475569', fontSize: 16, lineHeight: 25 },
  reference: { color: '#475569', fontSize: 13, lineHeight: 20, marginTop: 20, marginBottom: 24 },
  primary: { minHeight: 48, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB' },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  secondary: { minHeight: 48, padding: 12, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#1D4ED8', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
