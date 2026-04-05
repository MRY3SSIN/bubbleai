import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { useVoicePreview } from '@/src/features/voice/use-voice';
import { colors, radii, spacing, typography } from '@/src/theme';
import type { VoiceState } from '@/src/types/domain';

export default function VoiceSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { data: transcriptPreview } = useVoicePreview();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (voiceState !== 'speaking' || !transcriptPreview?.length) {
      return;
    }

    const interval = setInterval(() => {
      setLineIndex((current) => (current + 1) % transcriptPreview.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [transcriptPreview, voiceState]);

  const transcript = transcriptPreview?.[lineIndex] ?? 'Tap the mic to start a calmer voice check-in.';

  return (
    <Screen scroll={false}>
      <BackHeader title={`Voice • ${sessionId?.slice(-4) ?? 'live'}`} />
      <View style={styles.content}>
        <Text style={styles.transcript}>{transcript}</Text>
        <View style={styles.rings}>
          {[220, 170, 120].map((size, index) => (
            <View
              key={size}
              style={[
                styles.ring,
                {
                  width: size,
                  height: size,
                  opacity: 0.18 + index * 0.12,
                },
              ]}
            />
          ))}
          <Pressable
            onPress={() =>
              setVoiceState((current) =>
                current === 'idle' || current === 'error' ? 'listening' : current === 'listening' ? 'speaking' : 'idle',
              )
            }
            style={styles.mic}
          >
            <Text style={styles.micLabel}>🎙️</Text>
          </Pressable>
        </View>
        <Text style={styles.state}>State: {voiceState}</Text>
        <View style={styles.controls}>
          <Pressable onPress={() => setVoiceState('idle')} style={[styles.control, styles.controlDanger]}>
            <Text style={styles.controlText}>End</Text>
          </Pressable>
          <Pressable onPress={() => setVoiceState('speaking')} style={[styles.control, styles.controlSuccess]}>
            <Text style={styles.controlText}>Speak</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.xxxl,
  },
  transcript: {
    color: colors.ink,
    marginTop: spacing.xxxl,
    textAlign: 'center',
    ...typography.h2,
  },
  rings: {
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  micLabel: {
    fontSize: 36,
  },
  state: {
    color: colors.inkMuted,
    ...typography.body,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.xxxl,
  },
  control: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 54,
    justifyContent: 'center',
    width: 92,
  },
  controlDanger: {
    backgroundColor: '#FFE5E5',
  },
  controlSuccess: {
    backgroundColor: '#E3F7E8',
  },
  controlText: {
    color: colors.ink,
    ...typography.label,
  },
});

