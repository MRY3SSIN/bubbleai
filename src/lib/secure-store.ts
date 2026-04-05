import * as SecureStore from 'expo-secure-store';

type StorageShape = {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
};

const CHUNK_SIZE = 1800;
const sanitizeKey = (name: string) => {
  const base = (name || 'bubbleai_store')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }

  return `${base || 'bubbleai_store'}.${hash.toString(16)}`;
};

const itemKey = (name: string) => sanitizeKey(name);
const chunkMetaKey = (name: string) => `${itemKey(name)}.chunks`;
const chunkItemKey = (name: string, index: number) => `${itemKey(name)}.${index}`;

const removeChunkedValue = async (name: string) => {
  const meta = await SecureStore.getItemAsync(chunkMetaKey(name));
  const count = Number(meta ?? 0);

  if (Number.isFinite(count) && count > 0) {
    await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.deleteItemAsync(chunkItemKey(name, index)),
      ),
    );
  }

  await SecureStore.deleteItemAsync(chunkMetaKey(name));
};

export const secureStoreStorage: StorageShape = {
  async getItem(name) {
    const chunkMeta = await SecureStore.getItemAsync(chunkMetaKey(name));

    if (!chunkMeta) {
      return SecureStore.getItemAsync(itemKey(name));
    }

    const chunkCount = Number(chunkMeta);

    if (!Number.isFinite(chunkCount) || chunkCount <= 0) {
      return SecureStore.getItemAsync(name);
    }

    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.getItemAsync(chunkItemKey(name, index)),
      ),
    );

    if (chunks.some((chunk) => chunk == null)) {
      return null;
    }

    return chunks.join('');
  },
  async setItem(name, value) {
    await SecureStore.deleteItemAsync(itemKey(name));
    await removeChunkedValue(name);

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(itemKey(name), value);
      return;
    }

    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) ?? [value];

    await SecureStore.setItemAsync(chunkMetaKey(name), String(chunks.length));
    await Promise.all(
      chunks.map((chunk, index) => SecureStore.setItemAsync(chunkItemKey(name, index), chunk)),
    );
  },
  async removeItem(name) {
    await SecureStore.deleteItemAsync(itemKey(name));
    await removeChunkedValue(name);
  },
};
