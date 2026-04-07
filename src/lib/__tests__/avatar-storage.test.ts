import { parseStoredAvatarValue } from '@/src/lib/avatar-storage';

describe('parseStoredAvatarValue', () => {
  it('keeps a plain storage path as avatarPath', () => {
    expect(parseStoredAvatarValue('user-id/avatar-123.jpg')).toEqual({
      avatarPath: 'user-id/avatar-123.jpg',
    });
  });

  it('extracts the storage path from a public Supabase avatar URL', () => {
    expect(
      parseStoredAvatarValue(
        'https://example.supabase.co/storage/v1/object/public/avatars/user-id/avatar-123.jpg',
      ),
    ).toEqual({
      avatarPath: 'user-id/avatar-123.jpg',
    });
  });

  it('leaves external avatar URLs as direct URLs', () => {
    expect(parseStoredAvatarValue('https://cdn.example.com/avatar.jpg')).toEqual({
      directUrl: 'https://cdn.example.com/avatar.jpg',
    });
  });
});
