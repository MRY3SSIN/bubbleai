import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useSendVoiceMessage } from '@/src/features/voice/use-voice';
import { colors, radii, spacing, typography } from '@/src/theme';
import type { VoiceState } from '@/src/types/domain';

const formatDuration = (durationMillis: number) => {
  const totalSeconds = Math.max(0, Math.floor(durationMillis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function VoiceSessionScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 120);
  const sendVoiceMessage = useSendVoiceMessage(sessionId);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('Tap the mic to start a calmer voice check-in.');
  const [assistantText, setAssistantText] = useState(
    'BubbleAI will turn your voice into a gentle reply in this same conversation.',
  );

  const isBusy = voiceState === 'processing' || sendVoiceMessage.isPending;
  const statusLabel = useMemo(() => {
    if (voiceState === 'listening') {
      return `Listening • ${formatDuration(recorderState.durationMillis)}`;
    }

    if (voiceState === 'processing') {
      return 'Processing your voice check-in';
    }

    if (voiceState === 'speaking') {
      return 'Response ready';
    }

    if (voiceState === 'error') {
      return 'Something interrupted the voice check-in';
    }

    return 'Ready when you are';
  }, [recorderState.durationMillis, voiceState]);

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone needed', 'Please allow microphone access to use voice check-ins.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
        interruptionMode: 'mixWithOthers',
        interruptionModeAndroid: 'duckOthers',
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setTranscript('Listening now. Speak at your own pace.');
      setAssistantText('BubbleAI will answer as soon as you stop recording.');
      setVoiceState('listening');
    } catch (error) {
      setVoiceState('error');
      Alert.alert(
        'Unable to start voice',
        error instanceof Error ? error.message : 'Try again in a moment.',
      );
    }
  };

  const stopRecording = async () => {
    try {
      setVoiceState('processing');
      await recorder.stop();
      const audioUri = recorder.uri ?? recorderState.url;

      if (!audioUri) {
        throw new Error('No recording was captured yet.');
      }

      const result = await sendVoiceMessage.mutateAsync(audioUri);
      setTranscript(result.transcript || 'BubbleAI could not hear that clearly. Try one more time.');
      setAssistantText(result.assistantText || 'BubbleAI is here with you. Try sending one more note.');
      setVoiceState('speaking');
    } catch (error) {
      setVoiceState('error');
      Alert.alert(
        'Voice check-in failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
        interruptionMode: 'mixWithOthers',
        interruptionModeAndroid: 'duckOthers',
      }).catch(() => undefined);
    }
  };

  return (
    <Screen scroll={false}>
      <BackHeader title={`Voice • ${sessionId?.slice(-4) ?? 'live'}`} />
      <View style={styles.content}>
        <Text style={styles.title}>Tap the mic to start a calmer voice check-in.</Text>
        <Text style={styles.state}>{statusLabel}</Text>

        <View style={styles.rings}>
          {[220, 170, 120].map((size, index) => (
            <View
              key={size}
              style={[
                styles.ring,
                {
                  width: size,
                  height: size,
                  opacity: voiceState === 'listening' ? 0.2 + index * 0.14 : 0.12 + index * 0.1,
                },
              ]}
            />
          ))}
          <Pressable
            disabled={isBusy}
            onPress={voiceState === 'listening' ? stopRecording : startRecording}
            style={[styles.mic, isBusy && styles.micDisabled]}
          >
            <Text style={styles.micLabel}>{voiceState === 'listening' ? 'Stop' : 'Mic'}</Text>
          </Pressable>
        </View>

        <AppCard style={styles.card}>
          <Text style={styles.cardEyebrow}>Your words</Text>
          <Text style={styles.cardBody}>{transcript}</Text>
        </AppCard>

        <AppCard style={styles.card}>
          <Text style={styles.cardEyebrow}>BubbleAI</Text>
          <Text style={styles.cardBody}>{assistantText}</Text>
        </AppCard>

        <View style={styles.controls}>
          <PillButton
            label="End"
            onPress={() => router.back()}
            style={styles.secondaryControl}
            variant="secondary"
          />
          <PillButton
            disabled={isBusy}
            label={voiceState === 'listening' ? 'Send voice' : 'Speak'}
            loading={isBusy}
            onPress={voiceState === 'listening' ? stopRecording : startRecording}
            style={styles.primaryControl}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: spacing.xxxl,
  },
  title: {
    color: colors.ink,
    marginTop: spacing.xl,
    textAlign: 'center',
    ...typography.h2,
  },
  state: {
    color: colors.inkMuted,
    marginTop: spacing.md,
    textAlign: 'center',
    ...typography.body,
  },
  rings: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xxxl,
    minHeight: 240,
    position: 'relative',
  },
  ring: {
    backgroundColor: colors.mint,
    borderRadius: 999,
    position: 'absolute',
  },
  mic: {
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderRadius: radii.pill,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  micDisabled: {
    opacity: 0.75,
  },
  micLabel: {
    color: colors.white,
    ...typography.h3,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardEyebrow: {
    color: colors.mint,
    marginBottom: spacing.xs,
    ...typography.label,
  },
  cardBody: {
    color: colors.ink,
    ...typography.body,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  secondaryControl: {
    flex: 1,
  },
  primaryControl: {
    flex: 1.4,
  },
});
