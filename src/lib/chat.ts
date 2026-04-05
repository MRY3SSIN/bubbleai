export const generateSessionTitle = (message: string) => {
  const cleaned = message.trim().replace(/\s+/g, ' ');

  if (!cleaned) {
    return 'New chat';
  }

  if (cleaned.length <= 36) {
    return cleaned;
  }

  return `${cleaned.slice(0, 33).trim()}...`;
};

