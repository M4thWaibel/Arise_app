import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, Fonts, FILL } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';
import { IconCheckThin, IconSparkle } from '@/components/ui/icons';

function Scanline() {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(y, { toValue: 1, duration: 6000, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [y]);
  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [-60, 900] });
  return (
    <View pointerEvents="none" style={styles.scanWrap}>
      <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(61,169,252,0.07)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

function BlinkCursor() {
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(o, { toValue: 0, duration: 10, useNativeDriver: true }),
        Animated.timing(o, { toValue: 0, duration: 440, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [o]);
  return <Animated.Text style={[styles.cursor, { opacity: o }]}>_</Animated.Text>;
}

function InfoCard({
  badge,
  badgeColor,
  bgColors,
  borderColor,
  title,
  titleColor = Colors.text,
  desc,
}: {
  badge: React.ReactNode;
  badgeColor: string;
  bgColors: [string, string];
  borderColor: string;
  title: string;
  titleColor?: string;
  desc: string;
}) {
  return (
    <LinearGradient
      colors={bgColors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={[styles.infoCard, { borderColor }]}
    >
      <View style={[styles.infoBadge, { borderColor: badgeColor }]}>
        {typeof badge === 'string' ? (
          <Text style={[styles.infoBadgeText, { color: badgeColor }]}>{badge}</Text>
        ) : (
          badge
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoTitle, { color: titleColor }]}>{title}</Text>
        <Text style={styles.infoDesc}>{desc}</Text>
      </View>
    </LinearGradient>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const setupForm = useGame((s) => s.setupForm);
  const setupError = useGame((s) => s.setupError);
  const setSetupField = useGame((s) => s.setSetupField);
  const createProfile = useGame((s) => s.createProfile);

  const onEnter = () => {
    createProfile();
    if (useGame.getState().profile) router.replace('/main');
  };

  const sexBorder = (v: string) => (setupForm.sex === v ? Colors.glow : 'rgba(61,169,252,0.2)');
  const sexBg = (v: string) => (setupForm.sex === v ? Colors.glow : 'rgba(61,169,252,0.05)');
  const sexFg = (v: string) => (setupForm.sex === v ? Colors.bgBase : Colors.textSoft);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0B1730', '#05070D']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
      <Scanline />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 && (
              <View style={styles.ob1}>
                <View style={styles.ob1Glow} />
                <Text style={styles.ob1Tag}>
                  [ SISTEMA ]
                  <BlinkCursor />
                </Text>
                <Text style={styles.ob1Title}>VOCÊ FOI{'\n'}ESCOLHIDO.</Text>
                <Text style={styles.ob1Sub}>
                  Apenas você pode ver esta janela. A partir de agora, sua disciplina vira
                  progressão — e a falha tem consequências.
                </Text>
              </View>
            )}

            {step === 2 && (
              <View style={styles.ob2}>
                <Text style={styles.protoTag}>[ PROTOCOLO ]</Text>
                <Text style={styles.h1}>Como o Sistema funciona</Text>
                <View style={{ gap: 12 }}>
                  <InfoCard
                    badge="5"
                    badgeColor={Colors.glow}
                    bgColors={['rgba(20,33,58,0.55)', 'rgba(8,14,26,0.6)']}
                    borderColor="rgba(61,169,252,0.22)"
                    title="Atributos"
                    desc="Cada hábito treina um dos 5 atributos: STR, AGI, INT, VIT e PER. Eles sobem de nível sozinhos."
                  />
                  <InfoCard
                    badge={<IconCheckThin size={16} color={Colors.glowCyan} />}
                    badgeColor={Colors.glowCyan}
                    bgColors={['rgba(20,33,58,0.55)', 'rgba(8,14,26,0.6)']}
                    borderColor="rgba(61,169,252,0.22)"
                    title="Quests diárias"
                    desc="Geradas todo dia. Concluí-las dá XP e sobe seu nível. Há um timer até o reset da meia-noite."
                  />
                  <InfoCard
                    badge="!"
                    badgeColor={Colors.redAlert}
                    bgColors={['rgba(40,12,18,0.5)', 'rgba(8,14,26,0.6)']}
                    borderColor="rgba(255,45,85,0.3)"
                    title="Penalidade"
                    titleColor={Colors.redSofter}
                    desc="Falhou numa quest obrigatória? O Sistema impõe uma Penalty Quest. Cumpra-a para se redimir."
                  />
                  <InfoCard
                    badge="S"
                    badgeColor={Colors.purple}
                    bgColors={['rgba(28,18,46,0.5)', 'rgba(8,14,26,0.6)']}
                    borderColor="rgba(139,92,246,0.3)"
                    title="Dungeons"
                    titleColor={Colors.purpleLight}
                    desc="Suas grandes metas viram dungeons rank E→S, divididas em andares. Limpá-las dá XP em bloco."
                  />
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.ob3}>
                <Text style={styles.protoTag}>[ REGISTRO DO CAÇADOR ]</Text>
                <Text style={[styles.h1, { marginBottom: 6 }]}>Quem é você?</Text>
                <Text style={styles.ob3Sub}>
                  O Sistema usa seus dados para calibrar seus atributos iniciais.
                </Text>

                <Text style={styles.fieldLabel}>NOME / CODINOME</Text>
                <TextInput
                  value={setupForm.name}
                  onChangeText={(v) => setSetupField('name', v)}
                  placeholder="Ex.: Jin"
                  placeholderTextColor={Colors.label}
                  style={[
                    styles.input,
                    {
                      marginBottom: 18,
                      borderColor:
                        setupError && !setupForm.name.trim() ? Colors.redAlert : 'rgba(61,169,252,0.3)',
                    },
                  ]}
                />

                <Text style={styles.fieldLabel}>SEXO</Text>
                <View style={styles.sexRow}>
                  {[
                    ['M', 'Masculino'],
                    ['F', 'Feminino'],
                    ['O', 'Outro'],
                  ].map(([v, l]) => (
                    <Pressable
                      key={v}
                      onPress={() => setSetupField('sex', v)}
                      style={[styles.sexOpt, { backgroundColor: sexBg(v), borderColor: sexBorder(v) }]}
                    >
                      <Text style={[styles.sexLabel, { color: sexFg(v) }]}>{l}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.threeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>IDADE</Text>
                    <TextInput
                      value={setupForm.age}
                      onChangeText={(v) => setSetupField('age', v)}
                      keyboardType="number-pad"
                      placeholder="anos"
                      placeholderTextColor={Colors.label}
                      style={[
                        styles.inputSmall,
                        {
                          borderColor:
                            setupError && !setupForm.age ? Colors.redAlert : 'rgba(61,169,252,0.3)',
                        },
                      ]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>PESO (KG)</Text>
                    <TextInput
                      value={setupForm.weight}
                      onChangeText={(v) => setSetupField('weight', v)}
                      keyboardType="number-pad"
                      placeholder="kg"
                      placeholderTextColor={Colors.label}
                      style={[
                        styles.inputSmall,
                        {
                          borderColor:
                            setupError && !setupForm.weight ? Colors.redAlert : 'rgba(61,169,252,0.3)',
                        },
                      ]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>ALTURA</Text>
                    <TextInput
                      value={setupForm.height}
                      onChangeText={(v) => setSetupField('height', v)}
                      keyboardType="number-pad"
                      placeholder="cm"
                      placeholderTextColor={Colors.label}
                      style={[styles.inputSmall, { borderColor: 'rgba(61,169,252,0.3)' }]}
                    />
                  </View>
                </View>

                {setupError && (
                  <Text style={styles.errText}>[ ! ] Preencha nome, idade e peso.</Text>
                )}

                <View style={styles.calibNote}>
                  <IconSparkle size={16} color={Colors.glow} />
                  <Text style={styles.calibText}>
                    Você desperta no <Text style={styles.calibE}>nível 5</Text>, com os 5 atributos
                    também no nível 5 e rank <Text style={styles.calibE}>E</Text>. Seus dados servem ao Sistema.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* footer */}
          <LinearGradient
            colors={['rgba(5,7,13,0.4)', Colors.bgBase]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
            style={styles.footer}
          >
            {step === 1 && (
              <Pressable onPress={() => setStep(2)} style={{ flex: 1 }}>
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[styles.cta, styles.ctaPurpleGlow]}
                >
                  <Text style={styles.ctaText}>ACEITAR O CHAMADO</Text>
                </LinearGradient>
              </Pressable>
            )}
            {step === 2 && (
              <>
                <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
                  <Text style={styles.backText}>VOLTAR</Text>
                </Pressable>
                <Pressable onPress={() => setStep(3)} style={{ flex: 1 }}>
                  <LinearGradient
                    colors={['#3DA9FC', '#1E6FD0']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={[styles.cta, styles.ctaBlueGlow]}
                  >
                    <Text style={styles.ctaText}>CONTINUAR</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
            {step === 3 && (
              <>
                <Pressable onPress={() => setStep(2)} style={styles.backBtn}>
                  <Text style={styles.backText}>VOLTAR</Text>
                </Pressable>
                <Pressable onPress={onEnter} style={{ flex: 1 }}>
                  <LinearGradient
                    colors={['#3DA9FC', '#1E6FD0']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={[styles.cta, styles.ctaBlueGlow]}
                  >
                    <Text style={styles.ctaText}>ENTRAR NO SISTEMA</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </LinearGradient>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgBase },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 12 },
  scanWrap: { ...FILL, overflow: 'hidden', opacity: 0.5 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 60 },

  // ob1
  ob1: {
    flexGrow: 1,
    minHeight: 520,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingVertical: 36,
  },
  ob1Glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  ob1Tag: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
    letterSpacing: 4,
    color: Colors.purple,
    marginBottom: 30,
  },
  cursor: { color: Colors.purpleLight, fontFamily: Fonts.monoRegular, fontSize: 11 },
  ob1Title: {
    fontFamily: Fonts.rajBold,
    fontSize: 42,
    lineHeight: 44,
    color: Colors.text,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(139,92,246,0.5)',
    textShadowRadius: 28,
    textShadowOffset: { width: 0, height: 0 },
  },
  ob1Sub: {
    marginTop: 22,
    maxWidth: 280,
    fontFamily: Fonts.chivoRegular,
    fontSize: 14,
    lineHeight: 22,
    color: '#8DA0C2',
    textAlign: 'center',
  },

  // shared headers
  protoTag: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
    letterSpacing: 3,
    color: Colors.labelDim,
    marginBottom: 6,
  },
  h1: {
    fontFamily: Fonts.rajBold,
    fontSize: 30,
    color: Colors.text,
    letterSpacing: 0.5,
    marginBottom: 24,
  },

  // ob2
  ob2: { paddingHorizontal: 26, paddingTop: 22, paddingBottom: 8 },
  infoCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 5,
    padding: 14,
    paddingHorizontal: 16,
  },
  infoBadge: {
    width: 34,
    height: 34,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadgeText: { fontFamily: Fonts.monoBold, fontSize: 14, fontWeight: '700' },
  infoTitle: { fontFamily: Fonts.rajSemiBold, fontSize: 16, color: Colors.text },
  infoDesc: { fontFamily: Fonts.chivoRegular, fontSize: 12.5, color: '#8DA0C2', lineHeight: 18.5 },

  // ob3
  ob3: { paddingHorizontal: 26, paddingTop: 22, paddingBottom: 8 },
  ob3Sub: { fontFamily: Fonts.chivoRegular, fontSize: 12.5, color: '#8DA0C2', lineHeight: 18.5, marginBottom: 22 },
  fieldLabel: {
    fontFamily: Fonts.monoRegular,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.label,
    marginBottom: 7,
  },
  input: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(20,33,58,0.5)',
    borderWidth: 1,
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.rajMedium,
  },
  inputSmall: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(20,33,58,0.5)',
    borderWidth: 1,
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.rajSemiBold,
  },
  sexRow: { flexDirection: 'row', gap: 7, marginBottom: 18 },
  sexOpt: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 6, borderWidth: 1 },
  sexLabel: { fontFamily: Fonts.rajSemiBold, fontSize: 14, letterSpacing: 0.3 },
  threeRow: { flexDirection: 'row', gap: 10 },
  errText: { fontFamily: Fonts.monoRegular, fontSize: 11, color: Colors.redSoft, marginTop: 12 },
  calibNote: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(61,169,252,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.18)',
  },
  calibText: { flex: 1, fontFamily: Fonts.chivoRegular, fontSize: 12, color: '#8DA0C2', lineHeight: 17.4 },
  calibE: { color: Colors.textSoft, fontFamily: Fonts.rajBold },

  // footer
  footer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingTop: 14,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(61,169,252,0.1)',
  },
  cta: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 6 },
  ctaText: { fontFamily: Fonts.rajBold, fontSize: 16, letterSpacing: 2, color: '#fff' },
  ctaPurpleGlow: {
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  ctaBlueGlow: {
    shadowColor: Colors.glow,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  backBtn: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.3)',
  },
  backText: { fontFamily: Fonts.rajSemiBold, fontSize: 15, letterSpacing: 1, color: Colors.textSoft },
});
