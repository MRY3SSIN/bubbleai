import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type SearchOption = {
  label: string;
  value: string;
  description?: string;
  keywords?: string;
};

type SearchSelectFieldProps = {
  label: string;
  placeholder?: string;
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
};

export const SearchSelectField = ({
  label,
  placeholder = 'Search',
  options,
  value,
  onChange,
}: SearchSelectFieldProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.value === value || option.label === value);
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return options.slice(0, 12);
    }

    return options
      .filter((option) => {
        const haystack = `${option.label} ${option.description ?? ''} ${option.keywords ?? ''}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 20);
  }, [options, query]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen((current) => !current)} style={styles.trigger}>
        <Text numberOfLines={1} style={styles.value}>
          {selected?.label ?? value ?? 'Select an option'}
        </Text>
        <Feather color={colors.inkMuted} name={open ? 'chevron-up' : 'search'} size={18} />
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          <View style={styles.searchRow}>
            <Feather color={colors.inkMuted} name="search" size={16} />
            <TextInput
              autoFocus
              onChangeText={setQuery}
              placeholder={placeholder}
              placeholderTextColor={colors.inkMuted}
              style={styles.searchInput}
              value={query}
            />
          </View>
          <ScrollView nestedScrollEnabled style={styles.results} keyboardShouldPersistTaps="handled">
            {filteredOptions.map((option) => {
              const active = option.value === value || option.label === value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setQuery('');
                    setOpen(false);
                  }}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {option.label}
                  </Text>
                  {option.description ? (
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  ) : null}
                </Pressable>
              );
            })}
            {!filteredOptions.length ? (
              <View style={styles.emptyState}>
                <Text style={styles.optionDescription}>No matches yet. Keep typing or add details manually below.</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
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
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.lg,
  },
  value: {
    color: colors.ink,
    flex: 1,
    paddingRight: spacing.sm,
    ...typography.body,
  },
  menu: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    minHeight: 52,
    ...typography.body,
  },
  results: {
    maxHeight: 240,
  },
  option: {
    gap: spacing.xs,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  optionActive: {
    backgroundColor: colors.cardStrong,
  },
  optionLabel: {
    color: colors.ink,
    ...typography.body,
  },
  optionLabelActive: {
    color: colors.mintDeep,
    fontFamily: 'Manrope_600SemiBold',
  },
  optionDescription: {
    color: colors.inkMuted,
    ...typography.caption,
  },
  emptyState: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});
