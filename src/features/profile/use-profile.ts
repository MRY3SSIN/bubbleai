import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dataService } from '@/src/lib/data-service';
import type { ContactRecord, CycleProfile, MedicalId, PrivacySettings, Profile } from '@/src/types/domain';

export const useProfile = () =>
  useQuery({
    queryKey: ['profile'],
    queryFn: () => dataService.getProfile(),
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: {
      fullName: string;
      displayName: string;
      pronouns?: string;
      birthYear?: number;
      genderIdentity?: string;
      preferredVoice: Profile['preferredVoice'];
      avatarPath?: string;
      avatarTheme?: Profile['avatarTheme'];
      avatarUrl?: string;
      smokingHabits?: string;
      drinkingHabits?: string;
      medicationsText?: string;
      symptomsText?: string;
    }) => dataService.updateProfile(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useMedicalId = () =>
  useQuery({
    queryKey: ['medical-id'],
    queryFn: () => dataService.getMedicalId(),
  });

export const useSaveMedicalId = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: MedicalId) => dataService.saveMedicalId(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-id'] });
    },
  });
};

export const useTrustedContacts = () =>
  useQuery({
    queryKey: ['trusted-contacts'],
    queryFn: () => dataService.listTrustedContacts(),
  });

export const useSaveTrustedContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contact: Omit<ContactRecord, 'id'> & { id?: string }) =>
      dataService.saveTrustedContact(contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-contacts'] });
    },
  });
};

export const useClinicianContacts = () =>
  useQuery({
    queryKey: ['clinician-contacts'],
    queryFn: () => dataService.listClinicianContacts(),
  });

export const useNotificationSettings = () =>
  useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => dataService.getNotificationSettings(),
  });

export const usePrivacySettings = () =>
  useQuery({
    queryKey: ['privacy-settings'],
    queryFn: () => dataService.getPrivacySettings(),
  });

export const useUpdatePrivacySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Partial<PrivacySettings>) => dataService.updatePrivacySettings(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useCycleProfile = () =>
  useQuery({
    queryKey: ['cycle-profile'],
    queryFn: () => dataService.getCycleProfile(),
  });

export const useSaveCycleProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CycleProfile) => dataService.saveCycleProfile(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-profile'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useExportData = () =>
  useMutation({
    mutationFn: () => dataService.exportMyData(),
  });

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dataService.deleteAccount(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useSaveClinicianContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contact: Omit<ContactRecord, 'id'> & { id?: string }) =>
      dataService.saveClinicianContact(contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinician-contacts'] });
    },
  });
};
