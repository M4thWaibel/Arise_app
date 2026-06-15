import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing } from 'react-native';
import { Fonts } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';

export function QuestXpFloat() {
  const questFx = useGame((s) => s.questFx);
  const clearQuestFx = useGame((s) => s.clearQuestFx);
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!questFx) return;
    p.setValue(0);
    Animated.timing(p, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => clearQuestFx());
  }, [questFx, p, clearQuestFx]);

  if (!questFx) return null;

  const translateY = p.interpolate({ inputRange: [0, 0.22, 1], outputRange: [0, -8, -66] });
  const scale = p.interpolate({ inputRange: [0, 0.22, 1], outputRange: [0.7, 1, 1] });
  const opacity = p.interpolate({ inputRange: [0, 0.22, 0.7, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { opacity, transform: [{ translateX: -80 }, { translateY }, { scale }] }]}>
      <Animated.Text
        style={[
          styles.text,
          { color: questFx.color, textShadowColor: questFx.color },
        ]}
      >
        +{questFx.amount} XP
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: '50%', top: '42%', width: 160, alignItems: 'center', zIndex: 30 },
  text: {
    fontFamily: Fonts.rajBold,
    fontSize: 34,
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  },
});
