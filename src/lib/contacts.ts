import * as Contacts from 'expo-contacts';

import type { ContactRecord } from '@/src/types/domain';

export const loadDeviceContacts = async (): Promise<ContactRecord[]> => {
  const { status } = await Contacts.requestPermissionsAsync();

  if (status !== 'granted') {
    return [];
  }

  const result = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
    pageSize: 20,
  });

  return result.data.map((contact) => ({
    id: contact.id,
    name: contact.name ?? 'Unnamed contact',
    relationship: 'Trusted person',
    phone: contact.phoneNumbers?.[0]?.number,
    email: contact.emails?.[0]?.email,
  }));
};

