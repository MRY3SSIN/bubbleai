import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type TokenInputFieldProps = {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  maxSuggestions?: number;
};

const normalizeTokens = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const TokenInputField = ({
  label,
  hint,
  placeholder,
  value,
  onChange,
  suggestions = [],
  maxSuggestions = 10,
}: TokenInputFieldProps) => {
  const [draft, setDraft] = useState('');
  const tokens = useMemo(() => normalizeTokens(value), [value]);
  const filteredSuggestions = useMemo(() => {
    const query = draft.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return suggestions
      .filter((item) => !tokens.includes(item))
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, maxSuggestions);
  }, [draft, maxSuggestions, suggestions, tokens]);

  const commitDraft = () => {
    const nextToken = draft.trim();
    if (!nextToken) {
      return;
    }

    const next = Array.from(new Set([...tokens, nextToken]));
    onChange(next.join(', '));
    setDraft('');
  };

  const removeToken = (token: string) => {
    onChange(tokens.filter((item) => item !== token).join(', '));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        <View style={styles.chips}>
          {tokens.map((token) => (
            <View key={token} style={styles.chip}>
              <Text style={styles.chipLabel}>{token}</Text>
              <Pressable hitSlop={8} onPress={() => removeToken(token)}>
                <Feather color={colors.inkMuted} name="x" size={14} />
              </Pressable>
            </View>
          ))}
        </View>
        <View style={styles.inputRow}>
          <TextInput
            onChangeText={setDraft}
            onSubmitEditing={commitDraft}
            placeholder={placeholder}
            placeholderTextColor={colors.inkMuted}
            returnKeyType="done"
            style={styles.input}
            value={draft}
          />
          <Pressable onPress={commitDraft} style={styles.addButton}>
            <Text style={styles.addLabel}>Save</Text>
          </Pressable>
        </View>
        {filteredSuggestions.length ? (
          <View style={styles.suggestions}>
            {filteredSuggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => {
                  onChange(Array.from(new Set([...tokens, suggestion])).join(', '));
                  setDraft('');
                }}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionLabel}>{suggestion}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.inkMuted,
    ...typography.label,
  },
  field: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 92,
    padding: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  chipLabel: {
    color: colors.ink,
    ...typography.caption,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  suggestionChip: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  suggestionLabel: {
    color: colors.mintDeep,
    ...typography.caption,
  },
  input: {
    color: colors.ink,
    flex: 1,
    minHeight: 44,
    ...typography.body,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  addLabel: {
    color: colors.mintDeep,
    ...typography.label,
  },
  hint: {
    color: colors.inkMuted,
    ...typography.caption,
  },
});
