import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import { AspectRatio } from '@patra/shared';

export interface LocalExportItem {
  id: string;
  title: string;
  aspectRatio: AspectRatio;
  resolution: '1080p' | '4K';
  fileUri: string;
  mimeType: string;
  createdAt: string;
}

const LOCAL_EXPORTS_KEY = 'patra_local_exports_v1';

export async function getLocalExports(): Promise<LocalExportItem[]> {
  const raw = await AsyncStorage.getItem(LOCAL_EXPORTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LocalExportItem[];
  } catch {
    return [];
  }
}

/** Saves exported video permanently inside the user's app storage + optionally to phone gallery. */
export async function saveExportToApp(params: {
  id: string;
  title: string;
  aspectRatio: AspectRatio;
  resolution: '1080p' | '4K';
  dataUrl: string;
  mimeType: string;
}): Promise<LocalExportItem> {
  const base64 = params.dataUrl.includes(',') ? params.dataUrl.split(',')[1] : params.dataUrl;
  const ext = params.mimeType.includes('png')
    ? 'png'
    : params.mimeType.includes('jpeg') || params.mimeType.includes('jpg')
    ? 'jpg'
    : params.mimeType.includes('mp4')
    ? 'mp4'
    : 'webm';
  const dir = `${FileSystem.documentDirectory}patra_exports/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const fileUri = `${dir}patra_${params.id}.${ext}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const item: LocalExportItem = {
    id: params.id,
    title: params.title,
    aspectRatio: params.aspectRatio,
    resolution: params.resolution,
    fileUri,
    mimeType: params.mimeType,
    createdAt: new Date().toISOString(),
  };

  const existing = await getLocalExports();
  const next = [item, ...existing];
  await AsyncStorage.setItem(LOCAL_EXPORTS_KEY, JSON.stringify(next));
  return item;
}

export async function saveToPhoneGallery(fileUri: string): Promise<boolean> {
  try {
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) return false;
    await MediaLibrary.saveToLibraryAsync(fileUri);
    return true;
  } catch {
    // Fallback to native Share sheet if iOS Photos rejects a non-MP4 stream
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(fileUri);
    }
    return false;
  }
}

export async function shareExportedVideo(fileUri: string, title: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return;
  await Sharing.shareAsync(fileUri, {
    dialogTitle: `Share ${title}`,
  });
}

export async function deleteLocalExport(id: string): Promise<LocalExportItem[]> {
  const existing = await getLocalExports();
  const target = existing.find((item) => item.id === id);
  if (target?.fileUri) {
    await FileSystem.deleteAsync(target.fileUri, { idempotent: true }).catch(() => {});
  }
  const next = existing.filter((item) => item.id !== id);
  await AsyncStorage.setItem(LOCAL_EXPORTS_KEY, JSON.stringify(next));
  return next;
}
