import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { FormField } from '@/src/components/forms/FormField';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useTrustedContacts, useSaveTrustedContact } from '@/src/features/profile/use-profile';
import { loadDeviceContacts } from '@/src/lib/contacts';
import { colors, radii, spacing, typography } from '@/src/theme';
import type { ContactRecord } from '@/src/types/domain';

type ContactDraft = {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  isFavorite: boolean;
};

export default function EmergencyContactsScreen() {
  const { data: trustedContacts } = useTrustedContacts();
  const saveTrustedContact = useSaveTrustedContact();
  const [deviceContacts, setDeviceContacts] = useState<ContactRecord[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [draft, setDraft] = useState<ContactDraft>({
    name: '',
    relationship: 'Trusted person',
    phone: '',
    email: '',
    isFavorite: true,
  });

  useEffect(() => {
    if (trustedContacts?.length && !draft.name) {
      setDraft((current) => ({
        ...current,
        relationship: trustedContacts[0]?.relationship ?? current.relationship,
      }));
    }
  }, [draft.name, trustedContacts]);

  const importContacts = async () => {
    try {
      setLoadingContacts(true);
      const contacts = await loadDeviceContacts();
      setDeviceContacts(contacts);
    } catch (error) {
      Alert.alert('Unable to load contacts', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoadingContacts(false);
    }
  };

  const saveManualContact = async () => {
    try {
      await saveTrustedContact.mutateAsync({
        name: draft.name.trim(),
        relationship: draft.relationship.trim() || 'Trusted person',
        phone: draft.phone.trim() || undefined,
        email: draft.email.trim() || undefined,
        isFavorite: draft.isFavorite,
      });
      setDraft({
        name: '',
        relationship: 'Trusted person',
        phone: '',
        email: '',
        isFavorite: true,
      });
      Alert.alert('Saved', 'Your trusted contact was added.');
    } catch (error) {
      Alert.alert('Unable to save contact', error instanceof Error ? error.message : 'Try again.');
    }
  };

  const addImportedContact = async (contact: ContactRecord) => {
    try {
      await saveTrustedContact.mutateAsync({
        name: contact.name,
        relationship: contact.relationship || 'Trusted person',
        phone: contact.phone,
        email: contact.email,
        isFavorite: true,
      });
      Alert.alert('Added', `${contact.name} was added to your trusted contacts.`);
    } catch (error) {
      Alert.alert('Unable to add contact', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <Screen>
      <BackHeader title="Emergency contacts" />

      <Text style={styles.sectionTitle}>Saved trusted contacts</Text>
      <View style={styles.stack}>
        {(trustedContacts ?? []).map((contact) => (
          <AppCard key={contact.id}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactMeta}>{contact.relationship}</Text>
            {contact.phone ? <Text style={styles.contactMeta}>{contact.phone}</Text> : null}
            {contact.email ? <Text style={styles.contactMeta}>{contact.email}</Text> : null}
          </AppCard>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Add manually</Text>
      <View style={styles.stack}>
        <FormField label="Name" value={draft.name} onChangeText={(value) => setDraft((current) => ({ ...current, name: value }))} />
        <FormField
          label="Relationship"
          value={draft.relationship}
          onChangeText={(value) => setDraft((current) => ({ ...current, relationship: value }))}
        />
        <FormField
          keyboardType="phone-pad"
          label="Phone"
          value={draft.phone}
          onChangeText={(value) => setDraft((current) => ({ ...current, phone: value }))}
        />
        <FormField
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          value={draft.email}
          onChangeText={(value) => setDraft((current) => ({ ...current, email: value }))}
        />
        <Pressable
          onPress={() => setDraft((current) => ({ ...current, isFavorite: !current.isFavorite }))}
          style={[styles.favoriteToggle, draft.isFavorite && styles.favoriteToggleActive]}
        >
          <Text style={[styles.favoriteText, draft.isFavorite && styles.favoriteTextActive]}>
            {draft.isFavorite ? 'Marked as favorite contact' : 'Tap to mark as favorite'}
          </Text>
        </Pressable>
      </View>

      <PillButton
        disabled={!draft.name.trim()}
        label="Save trusted contact"
        loading={saveTrustedContact.isPending}
        onPress={saveManualContact}
        style={styles.saveButton}
      />

      <View style={styles.importHeader}>
        <Text style={styles.sectionTitle}>Import from phone</Text>
        <PillButton
          label={loadingContacts ? 'Loading...' : 'Load contacts'}
          onPress={importContacts}
          style={styles.importButton}
          variant="secondary"
        />
      </View>

      <View style={styles.stack}>
        {deviceContacts.map((contact) => (
          <AppCard key={contact.id}>
            <Text style={styles.contactName}>{contact.name}</Text>
            {contact.phone ? <Text style={styles.contactMeta}>{contact.phone}</Text> : null}
            {contact.email ? <Text style={styles.contactMeta}>{contact.email}</Text> : null}
            <PillButton
              label="Add to trusted list"
              onPress={() => addImportedContact(contact)}
              style={styles.inlineButton}
              variant="secondary"
            />
          </AppCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.ink,
    marginBottom: spacing.md,
    ...typography.h2,
  },
  stack: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  contactName: {
    color: colors.ink,
    ...typography.h3,
  },
  contactMeta: {
    color: colors.inkMuted,
    marginTop: spacing.xs,
    ...typography.caption,
  },
  favoriteToggle: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  favoriteToggleActive: {
    backgroundColor: colors.cardStrong,
    borderColor: colors.mint,
  },
  favoriteText: {
    color: colors.inkMuted,
    ...typography.label,
  },
  favoriteTextActive: {
    color: colors.ink,
  },
  saveButton: {
    marginBottom: spacing.xxxl,
  },
  importHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  importButton: {
    minHeight: 48,
  },
  inlineButton: {
    marginTop: spacing.lg,
  },
});
