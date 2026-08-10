import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import {
  AttributeField,
  SelectChips,
} from '@/components/wardrobe/AttributeField';
import { useApp } from '@/context/AppContext';
import type { ClothingCategory } from '@/constants/theme';
import { colors, radii, spacing } from '@/constants/theme';
import {
  getItemImages,
  MAX_ITEM_PHOTOS,
  withItemImages,
} from '@/lib/itemImages';
import { saveWardrobeImage } from '@/lib/uploadImage';

const CATEGORY_OPTIONS: ClothingCategory[] = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Shoes',
  'Jewelry',
  'Accessories',
];

const GALLERY_WIDTH = Dimensions.get('window').width - spacing.lg * 2;

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    items,
    updateItem,
    deleteItem,
    markItemWorn,
    getItemWearStats,
    user,
  } = useApp();
  const insets = useSafeAreaInsets();
  const item = useMemo(() => items.find((i) => i.id === id), [items, id]);
  const wearStats = useMemo(
    () => (id ? getItemWearStats(id) : { wearCount: 0 }),
    [getItemWearStats, id],
  );
  const images = useMemo(
    () => (item ? getItemImages(item) : []),
    [item],
  );

  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<ClothingCategory>(
    item?.attributes.category ?? 'Tops',
  );
  const [color, setColor] = useState(item?.attributes.color ?? '');
  const [pattern, setPattern] = useState(item?.attributes.pattern ?? '');
  const [material, setMaterial] = useState(item?.attributes.material ?? '');
  const [style, setStyle] = useState(item?.attributes.style ?? '');
  const [occasion, setOccasion] = useState(item?.attributes.occasion ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wearing, setWearing] = useState(false);
  const [justWorn, setJustWorn] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const galleryRef = useRef<FlatList<string>>(null);

  if (!item) {
    return (
      <View style={styles.missing}>
        <Text variant="subtitle">Item not found</Text>
        <Button label="Back to wardrobe" onPress={() => router.back()} />
      </View>
    );
  }

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await updateItem(item.id, {
        name: name.trim() || item.name,
        attributes: {
          category,
          color,
          pattern,
          material,
          style,
          occasion,
        },
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const onWearToday = async () => {
    setWearing(true);
    try {
      await markItemWorn(item.id);
      setJustWorn(true);
      setTimeout(() => setJustWorn(false), 1600);
    } finally {
      setWearing(false);
    }
  };

  const persistImages = async (nextImages: string[], coverUri?: string) => {
    const next = withItemImages(item, nextImages, coverUri);
    await updateItem(item.id, {
      imageUri: next.imageUri,
      imageUris: next.imageUris,
    });
  };

  const addPhoto = async (fromCamera: boolean) => {
    if (images.length >= MAX_ITEM_PHOTOS) {
      showMessage(
        'Photo limit',
        `You can add up to ${MAX_ITEM_PHOTOS} photos per piece.`,
      );
      return;
    }

    setPhotoBusy(true);
    try {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showMessage(
            'Camera permission needed',
            'Allow camera access to photograph clothing.',
          );
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.85,
          allowsEditing: true,
          aspect: [3, 4],
        });
        if (result.canceled) return;
        const persisted = await saveWardrobeImage(
          result.assets[0].uri,
          user?.id,
        );
        const nextImages = [...images, persisted];
        await persistImages(nextImages);
        setActivePhoto(nextImages.length - 1);
        requestAnimationFrame(() => {
          galleryRef.current?.scrollToIndex({
            index: nextImages.length - 1,
            animated: true,
          });
        });
        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showMessage(
          'Photos permission needed',
          'Allow photo library access to upload clothing.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [3, 4],
      });
      if (result.canceled) return;
      const persisted = await saveWardrobeImage(
        result.assets[0].uri,
        user?.id,
      );
      const nextImages = [...images, persisted];
      await persistImages(nextImages);
      setActivePhoto(nextImages.length - 1);
      requestAnimationFrame(() => {
        galleryRef.current?.scrollToIndex({
          index: nextImages.length - 1,
          animated: true,
        });
      });
    } catch (error) {
      showMessage(
        'Could not add photo',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const promptAddPhoto = () => {
    if (Platform.OS === 'web') {
      void addPhoto(false);
      return;
    }
    Alert.alert('Add photo', 'Choose a source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: () => void addPhoto(true) },
      { text: 'Library', onPress: () => void addPhoto(false) },
    ]);
  };

  const setCover = async (uri: string) => {
    if (uri === images[0]) return;
    await persistImages(images, uri);
    setActivePhoto(0);
    galleryRef.current?.scrollToIndex({ index: 0, animated: true });
  };

  const removePhoto = async (uri: string) => {
    if (images.length <= 1) {
      showMessage('Keep one photo', 'Each piece needs at least one photo.');
      return;
    }
    const nextImages = images.filter((image) => image !== uri);
    const nextIndex = Math.min(activePhoto, nextImages.length - 1);
    await persistImages(nextImages, nextImages[0]);
    setActivePhoto(nextIndex);
  };

  const onPhotoActions = (uri: string) => {
    const isCover = uri === images[0];
    if (Platform.OS === 'web') {
      const action = window.prompt(
        isCover
          ? 'Type “remove” to delete this photo'
          : 'Type “cover” to set as cover, or “remove” to delete',
      );
      if (action?.toLowerCase() === 'cover' && !isCover) {
        void setCover(uri);
      } else if (action?.toLowerCase() === 'remove') {
        void removePhoto(uri);
      }
      return;
    }

    Alert.alert('Photo', undefined, [
      { text: 'Cancel', style: 'cancel' },
      ...(isCover
        ? []
        : [
            {
              text: 'Set as cover',
              onPress: () => void setCover(uri),
            },
          ]),
      {
        text: 'Remove photo',
        style: 'destructive' as const,
        onPress: () => void removePhoto(uri),
      },
    ]);
  };

  const onGalleryScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / GALLERY_WIDTH,
    );
    if (index !== activePhoto && index >= 0 && index < images.length) {
      setActivePhoto(index);
    }
  };

  const onDelete = async () => {
    const message = `Remove “${item.name}” from your wardrobe?`;
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' ? window.confirm(message) : false;
      if (!confirmed) return;
      await deleteItem(item.id);
      router.back();
      return;
    }

    Alert.alert('Delete item', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: item.name }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gallery}>
          <FlatList
            ref={galleryRef}
            data={images}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onGalleryScroll}
            scrollEventThrottle={16}
            onScrollToIndexFailed={() => undefined}
            renderItem={({ item: uri }) => (
              <Pressable onLongPress={() => onPhotoActions(uri)}>
                <Image
                  source={{ uri }}
                  style={[styles.image, { width: GALLERY_WIDTH }]}
                  contentFit="cover"
                  transition={250}
                />
              </Pressable>
            )}
          />
          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((uri, index) => (
                <View
                  key={`${uri}-dot-${index}`}
                  style={[
                    styles.dot,
                    index === activePhoto ? styles.dotActive : null,
                  ]}
                />
              ))}
            </View>
          ) : null}
          {images[activePhoto] === images[0] ? (
            <View style={styles.coverBadge}>
              <Text variant="caption" color={colors.white}>
                Cover
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.photoRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbs}
          >
            {images.map((uri, index) => (
              <Pressable
                key={`${uri}-thumb-${index}`}
                onPress={() => {
                  setActivePhoto(index);
                  galleryRef.current?.scrollToIndex({
                    index,
                    animated: true,
                  });
                }}
                onLongPress={() => onPhotoActions(uri)}
                style={[
                  styles.thumbWrap,
                  index === activePhoto ? styles.thumbActive : null,
                ]}
              >
                <Image
                  source={{ uri }}
                  style={styles.thumb}
                  contentFit="cover"
                />
              </Pressable>
            ))}
            {images.length < MAX_ITEM_PHOTOS ? (
              <Pressable
                style={styles.addThumb}
                onPress={promptAddPhoto}
                disabled={photoBusy}
              >
                <Ionicons
                  name={photoBusy ? 'hourglass-outline' : 'add'}
                  size={22}
                  color={colors.primary}
                />
                <Text variant="caption" color={colors.primary}>
                  Add
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
          <Text variant="caption" color={colors.muted}>
            {images.length > 1
              ? `${images.length} photos · long-press to set cover or remove`
              : 'Add more angles so outfits and AI see the full piece'}
          </Text>
        </View>

        {item.aiConfidence ? (
          <View style={styles.confidence}>
            <Text variant="caption" color={colors.primary}>
              Originally AI-tagged · {Math.round(item.aiConfidence * 100)}%
            </Text>
          </View>
        ) : null}

        {editing ? (
          <View style={styles.form}>
            <Input label="Name" value={name} onChangeText={setName} />
            <SelectChips
              label="Category"
              value={category}
              options={CATEGORY_OPTIONS}
              onChange={(value) => setCategory(value as ClothingCategory)}
            />
            <AttributeField
              label="Color"
              value={color}
              editable
              onChangeText={setColor}
            />
            <AttributeField
              label="Pattern"
              value={pattern}
              editable
              onChangeText={setPattern}
            />
            <AttributeField
              label="Material"
              value={material}
              editable
              onChangeText={setMaterial}
            />
            <AttributeField
              label="Style"
              value={style}
              editable
              onChangeText={setStyle}
            />
            <AttributeField
              label="Occasion"
              value={occasion}
              editable
              onChangeText={setOccasion}
            />
            <Button
              label={saving ? 'Saving…' : 'Save changes'}
              onPress={onSave}
              disabled={saving}
            />
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => setEditing(false)}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Text variant="title">{item.name}</Text>
            <View style={styles.wearCard}>
              <Text variant="caption" color={colors.primary}>
                Wear tracking
              </Text>
              <Text variant="bodyMedium">
                {wearStats.wearCount === 0
                  ? 'Not worn yet'
                  : `Worn ${wearStats.wearCount}×`}
              </Text>
              <Text variant="caption" color={colors.muted}>
                {wearStats.lastWornAt
                  ? `Last worn ${new Date(wearStats.lastWornAt).toLocaleDateString()}`
                  : 'Mark it when you wear this piece alone or in an outfit.'}
              </Text>
              <Button
                label={
                  wearing ? 'Saving…' : justWorn ? 'Marked worn' : 'Wear today'
                }
                onPress={onWearToday}
                disabled={wearing}
              />
            </View>
            <AttributeField label="Category" value={item.attributes.category} />
            <AttributeField label="Color" value={item.attributes.color} />
            <AttributeField label="Pattern" value={item.attributes.pattern} />
            <AttributeField label="Material" value={item.attributes.material} />
            <AttributeField label="Style" value={item.attributes.style} />
            <AttributeField label="Occasion" value={item.attributes.occasion} />
            <Button label="Edit details" onPress={() => setEditing(true)} />
            <Button label="Delete item" variant="danger" onPress={onDelete} />
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  gallery: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    aspectRatio: 0.9,
    backgroundColor: colors.surfaceMuted,
  },
  dots: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 16,
  },
  coverBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.overlay,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  photoRow: {
    gap: spacing.sm,
  },
  thumbs: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  thumbWrap: {
    width: 56,
    height: 72,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: colors.primary,
  },
  thumb: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceMuted,
  },
  addThumb: {
    width: 56,
    height: 72,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  confidence: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMist,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  wearCard: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
});
