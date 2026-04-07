const publicAvatarMarkers = [
  '/storage/v1/object/public/avatars/',
  '/storage/v1/object/sign/avatars/',
];

export const avatarSignedUrlTtlSeconds = 60 * 60 * 24 * 7;

export const parseStoredAvatarValue = (
  value?: string | null,
): { avatarPath?: string; directUrl?: string } => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return {};
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);

      for (const marker of publicAvatarMarkers) {
        const index = url.pathname.indexOf(marker);

        if (index >= 0) {
          return {
            avatarPath: decodeURIComponent(url.pathname.slice(index + marker.length)),
          };
        }
      }

      return { directUrl: trimmed };
    } catch {
      return { directUrl: trimmed };
    }
  }

  if (trimmed.startsWith('file://')) {
    return { directUrl: trimmed };
  }

  return {
    avatarPath: trimmed.replace(/^\/+/, ''),
  };
};
