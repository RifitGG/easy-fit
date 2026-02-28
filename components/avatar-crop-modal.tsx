import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_SIZE = Math.round(SCREEN_WIDTH * 0.72);
const OVERLAY_BORDER = 600;

interface CropData {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

interface Props {
  visible: boolean;
  imageUri: string;
  onConfirm: (cropData: CropData) => void;
  onCancel: () => void;
}

export function AvatarCropModal({ visible, imageUri, onConfirm, onCancel }: Props) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);

  const animScale = useRef(new Animated.Value(1)).current;
  const animTx = useRef(new Animated.Value(0)).current;
  const animTy = useRef(new Animated.Value(0)).current;

  const scaleVal = useRef(1);
  const txVal = useRef(0);
  const tyVal = useRef(0);

  const panRef = useRef({ x: 0, y: 0, active: false });
  const pinchRef = useRef({ dist: 0, scale: 1 });

  useEffect(() => {
    if (!imageUri || !visible) return;
    setLoading(true);
    Image.getSize(
      imageUri,
      (w, h) => {
        setImageSize({ width: w, height: h });
        scaleVal.current = 1;
        txVal.current = 0;
        tyVal.current = 0;
        animScale.setValue(1);
        animTx.setValue(0);
        animTy.setValue(0);
        panRef.current = { x: 0, y: 0, active: false };
        pinchRef.current = { dist: 0, scale: 1 };
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [imageUri, visible]);

  const { displayW, displayH } = useMemo(() => {
    if (!imageSize.width || !imageSize.height) return { displayW: CROP_SIZE, displayH: CROP_SIZE };
    const ratio = imageSize.width / imageSize.height;
    if (ratio >= 1) {
      return { displayW: CROP_SIZE * ratio, displayH: CROP_SIZE };
    } else {
      return { displayW: CROP_SIZE, displayH: CROP_SIZE / ratio };
    }
  }, [imageSize]);

  const containerH = SCREEN_HEIGHT - 140;
  const cropCenterX = SCREEN_WIDTH / 2;
  const cropCenterY = containerH / 2;
  const cropRadius = CROP_SIZE / 2;

  function getDistance(touches: any) {
    if (!touches || touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2,
    onPanResponderGrant: (evt) => {
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        const mx = (touches[0].pageX + touches[1].pageX) / 2;
        const my = (touches[0].pageY + touches[1].pageY) / 2;
        panRef.current = { x: mx, y: my, active: true };
        pinchRef.current = { dist: getDistance(touches), scale: scaleVal.current };
      } else {
        panRef.current = { x: touches[0].pageX, y: touches[0].pageY, active: true };
        pinchRef.current = { dist: 0, scale: scaleVal.current };
      }
    },
    onPanResponderMove: (evt) => {
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        const dist = getDistance(touches);
        if (pinchRef.current.dist === 0) {
          pinchRef.current = { dist, scale: scaleVal.current };
        } else if (pinchRef.current.dist > 0) {
          const newScale = Math.max(0.5, Math.min(5, pinchRef.current.scale * (dist / pinchRef.current.dist)));
          scaleVal.current = newScale;
          animScale.setValue(newScale);
        }
        const mx = (touches[0].pageX + touches[1].pageX) / 2;
        const my = (touches[0].pageY + touches[1].pageY) / 2;
        if (panRef.current.active) {
          txVal.current += mx - panRef.current.x;
          tyVal.current += my - panRef.current.y;
          animTx.setValue(txVal.current);
          animTy.setValue(tyVal.current);
        }
        panRef.current = { x: mx, y: my, active: true };
      } else if (touches.length === 1) {
        if (pinchRef.current.dist !== 0) {
          pinchRef.current.dist = 0;
          panRef.current = { x: touches[0].pageX, y: touches[0].pageY, active: true };
          return;
        }
        if (panRef.current.active) {
          txVal.current += touches[0].pageX - panRef.current.x;
          tyVal.current += touches[0].pageY - panRef.current.y;
          animTx.setValue(txVal.current);
          animTy.setValue(tyVal.current);
        }
        panRef.current = { x: touches[0].pageX, y: touches[0].pageY, active: true };
      }
    },
    onPanResponderRelease: () => {
      panRef.current.active = false;
      pinchRef.current.dist = 0;
    },
  }), []);

  const handleConfirm = () => {
    if (!imageSize.width || !imageSize.height) return;

    const s = scaleVal.current;
    const tx = txVal.current;
    const ty = tyVal.current;
    const r = cropRadius;

    const ratio = imageSize.width / displayW;

    const cropDispX = (displayW * s / 2 - r - tx);
    const cropDispY = (displayH * s / 2 - r - ty);
    const cropDispSize = 2 * r;

    let originX = Math.round(cropDispX * ratio / s);
    let originY = Math.round(cropDispY * ratio / s);
    let cropSize = Math.round(cropDispSize * ratio / s);

    originX = Math.max(0, originX);
    originY = Math.max(0, originY);
    cropSize = Math.min(cropSize, imageSize.width - originX, imageSize.height - originY);
    cropSize = Math.max(1, cropSize);

    onConfirm({
      cropX: originX,
      cropY: originY,
      cropWidth: cropSize,
      cropHeight: cropSize,
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <View style={s.container}>
        <View style={s.header}>
          <Pressable onPress={onCancel} hitSlop={12} style={s.headerBtnWrap}>
            <Text style={s.headerBtnCancel}>Отмена</Text>
          </Pressable>
          <Text style={s.headerTitle}>Кадрирование</Text>
          <Pressable onPress={handleConfirm} hitSlop={12} style={s.headerBtnWrap}>
            <Text style={s.headerBtnConfirm}>Готово</Text>
          </Pressable>
        </View>

        <View style={[s.cropContainer, { height: containerH }]} {...panResponder.panHandlers}>
          {loading ? (
            <ActivityIndicator size="large" color="#8B83FF" />
          ) : (
            <>
              <Animated.Image
                source={{ uri: imageUri }}
                style={{
                  width: displayW,
                  height: displayH,
                  transform: [
                    { translateX: animTx },
                    { translateY: animTy },
                    { scale: animScale },
                  ],
                }}
                resizeMode="cover"
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: CROP_SIZE + OVERLAY_BORDER * 2,
                  height: CROP_SIZE + OVERLAY_BORDER * 2,
                  borderRadius: (CROP_SIZE + OVERLAY_BORDER * 2) / 2,
                  borderWidth: OVERLAY_BORDER,
                  borderColor: 'rgba(0,0,0,0.6)',
                  top: cropCenterY - cropRadius - OVERLAY_BORDER,
                  left: cropCenterX - cropRadius - OVERLAY_BORDER,
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: CROP_SIZE,
                  height: CROP_SIZE,
                  borderRadius: cropRadius,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.8)',
                  top: cropCenterY - cropRadius,
                  left: cropCenterX - cropRadius,
                }}
              />
            </>
          )}
        </View>

        <View style={s.hintRow}>
          <Text style={s.hint}>Перетащите и увеличьте фото</Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
    backgroundColor: '#111',
  },
  headerBtnWrap: { minWidth: 70 },
  headerBtnCancel: { color: '#fff', fontSize: 16 },
  headerBtnConfirm: { color: '#8B83FF', fontSize: 16, fontWeight: '700', textAlign: 'right' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cropContainer: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintRow: { paddingVertical: 18, alignItems: 'center', backgroundColor: '#111' },
  hint: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
});
