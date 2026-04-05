import Constants from 'expo-constants';

const isExpoGo =
  (Constants as { executionEnvironment?: string }).executionEnvironment === 'storeClient' ||
  (Constants as { appOwnership?: string }).appOwnership === 'expo';

let notificationHandlerRegistered = false;

const getNotificationsModule = async () => {
  if (isExpoGo) {
    return null;
  }

  const Notifications = await import('expo-notifications');

  if (!notificationHandlerRegistered) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerRegistered = true;
  }

  return Notifications;
};

export const notificationsSupportedInCurrentRuntime = !isExpoGo;

export const requestNotificationPermissions = async () => {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return false;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleReminderPreview = async (title: string, body: string) => {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return null;
  }

  const granted = await requestNotificationPermissions();

  if (!granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
};
