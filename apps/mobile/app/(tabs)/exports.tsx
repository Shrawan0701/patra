import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExportRecord } from '@patra/shared';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/lib/api';
import {
  LocalExportItem,
  deleteLocalExport,
  getLocalExports,
  saveToPhoneGallery,
  shareExportedVideo,
} from '../../src/lib/localExports';
import { FONTS, SHADOWS, successHaptic, tapHaptic } from '../../src/theme';

export default function ExportsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [localVideos, setLocalVideos] = useState<LocalExportItem[]>([]);
  const [serverHistory, setServerHistory] = useState<ExportRecord[]>([]);

  const loadAll = useCallback(async () => {
    const [locals, remote] = await Promise.all([
      getLocalExports(),
      api.exportHistory().catch(() => ({ exports: [] })),
    ]);
    setLocalVideos(locals);
    setServerHistory(remote.exports);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAll();
    }, [loadAll])
  );

  const handleSaveGallery = async (uri: string) => {
    tapHaptic();
    const ok = await saveToPhoneGallery(uri);
    if (ok) {
      successHaptic();
      Alert.alert('Saved to Photos', 'Your invitation download is saved in your phone gallery.');
    } else {
      Alert.alert('Permission Needed', 'Allow photo library access to save videos to your gallery.');
    }
  };

  const handleDeleteLocal = (item: LocalExportItem) => {
    tapHaptic();
    Alert.alert('Delete Download?', `Remove "${item.title}" from your downloaded videos?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = await deleteLocalExport(item.id);
          setLocalVideos(next);
          await api.deleteExport(item.id).catch(() => {});
          setServerHistory((prev) => prev.filter((r) => r.id !== item.id));
        },
      },
    ]);
  };

  const handleDeleteLog = (rec: ExportRecord) => {
    tapHaptic();
    Alert.alert('Remove Log?', `Remove "${rec.projectTitle}" from download history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.deleteExport(rec.id).catch(() => {});
          setServerHistory((prev) => prev.filter((r) => r.id !== rec.id));
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.paper }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.vermilion }]}>MY SAVED INVITATIONS</Text>
      <Text style={[styles.heading, { color: colors.ink }]}>Your Downloads</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        All downloaded 3D videos and 1-page cards stay saved right here in your app, ready to share anytime.
      </Text>

      {localVideos.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.cream, borderColor: colors.border },
          ]}
        >
          <Ionicons name="film-outline" size={34} color={colors.vermilion} />
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>No Downloads Yet</Text>
          <Text style={[styles.emptySub, { color: colors.muted }]}>
            Open any 3D template or 1-page card, customize your design, and tap Download.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {localVideos.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                { backgroundColor: colors.cream, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.badge, { backgroundColor: colors.vermilionSoft }]}>
                  <Ionicons name="videocam" size={16} color={colors.vermilion} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.ink }]}>{item.title}</Text>
                  <Text style={[styles.meta, { color: colors.muted }]}>
                    {item.resolution} · {item.aspectRatio} ·{' '}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteLocal(item)}
                  style={{ padding: 6 }}
                  accessibilityLabel={`Delete ${item.title}`}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.vermilion} />
                </TouchableOpacity>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.paper, borderColor: colors.border },
                  ]}
                  onPress={() => handleSaveGallery(item.fileUri)}
                >
                  <Ionicons name="download-outline" size={16} color={colors.ink} />
                  <Text style={[styles.actionText, { color: colors.ink }]}>Save to Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.vermilion, borderColor: colors.vermilion },
                  ]}
                  onPress={() => {
                    tapHaptic();
                    void shareExportedVideo(item.fileUri, item.title);
                  }}
                >
                  <Ionicons name="share-social-outline" size={16} color="#fff" />
                  <Text style={[styles.actionText, { color: '#fff' }]}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {serverHistory.length > 0 && (
        <View style={{ marginTop: 26 }}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>
            ACCOUNT DOWNLOAD LOG ({serverHistory.length})
          </Text>
          {serverHistory.map((rec) => (
              <View
                key={rec.id}
                style={[
                  styles.logRow,
                  { backgroundColor: colors.cream, borderColor: colors.border, alignItems: 'center' },
                ]}
              >
                <Text style={[styles.logTitle, { color: colors.ink, flex: 1 }]}>{rec.projectTitle}</Text>
                <Text style={[styles.logMeta, { color: colors.muted, marginRight: 10 }]}>
                  {rec.resolution} · {rec.aspectRatio}
                </Text>
                <TouchableOpacity onPress={() => handleDeleteLog(rec)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={16} color={colors.vermilion} />
                </TouchableOpacity>
              </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 36 },
  eyebrow: { fontFamily: FONTS.semibold, fontSize: 11, letterSpacing: 1.4 },
  heading: { fontFamily: FONTS.bold, fontSize: 25, letterSpacing: -0.4, marginTop: 2 },
  sub: { fontFamily: FONTS.hand, fontSize: 17, marginTop: 4, marginBottom: 18, lineHeight: 22 },
  emptyCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    ...SHADOWS.paperCard,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginTop: 4 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  list: { gap: 12 },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 14,
    ...SHADOWS.paperCard,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, marginBottom: 10 },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  logTitle: { fontSize: 14, fontWeight: '600' },
  logMeta: { fontSize: 12 },
});
