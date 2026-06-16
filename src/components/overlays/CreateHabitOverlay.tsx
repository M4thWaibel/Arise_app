import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, ATTRS, DIFF, FILL, type DiffKey } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';

export function CreateHabitOverlay() {
  const insets = useSafeAreaInsets();
  const form = useGame((s) => s.form);
  const editingId = useGame((s) => s.editingId);
  const deleteHabit = useGame((s) => s.deleteHabit);
  const setFormName = useGame((s) => s.setFormName);
  const setFormAttr = useGame((s) => s.setFormAttr);
  const setFormDiff = useGame((s) => s.setFormDiff);
  const setFormMetric = useGame((s) => s.setFormMetric);
  const setFormMetricGoal = useGame((s) => s.setFormMetricGoal);
  const setFormSideQuest = useGame((s) => s.setFormSideQuest);
  const toggleFormMandatory = useGame((s) => s.toggleFormMandatory);
  const saveHabit = useGame((s) => s.saveHabit);
  const closeOverlay = useGame((s) => s.closeOverlay);

  const diffEntries = Object.entries(DIFF) as [DiffKey, (typeof DIFF)[DiffKey]][];

  return (
    <KeyboardAvoidingView style={styles.root} behavior="padding">
      <Pressable style={styles.backdrop} onPress={closeOverlay} />
      <LinearGradient
        colors={['#0B1322', '#070A12']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.sheet, { paddingBottom: 22 + insets.bottom }]}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.handle} />
          <Text style={styles.title}>{editingId ? 'Editar hábito' : 'Novo hábito'}</Text>

          <Text style={styles.fieldLabel}>TÍTULO</Text>
          <TextInput
            value={form.name}
            onChangeText={setFormName}
            placeholder="Ex.: Beber 3 L de água"
            placeholderTextColor={Colors.label}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>ATRIBUTO</Text>
          <View style={styles.attrRow}>
            {ATTRS.map((m) => {
              const active = form.attr === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setFormAttr(m.key)}
                  style={[
                    styles.attrOpt,
                    {
                      backgroundColor: active ? m.color : 'rgba(61,169,252,0.05)',
                      borderColor: active ? m.color : 'rgba(61,169,252,0.2)',
                    },
                  ]}
                >
                  <Text style={[styles.attrOptText, { color: active ? Colors.bgBase : Colors.textSoft }]}>
                    {m.key}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>DIFICULDADE</Text>
          <View style={styles.diffGrid}>
            {diffEntries.map(([k, v]) => {
              const active = form.diff === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setFormDiff(k)}
                  style={[
                    styles.diffOpt,
                    {
                      backgroundColor: active ? v.color : 'rgba(61,169,252,0.05)',
                      borderColor: active ? v.color : 'rgba(61,169,252,0.2)',
                    },
                  ]}
                >
                  <Text style={[styles.diffLabel, { color: active ? Colors.bgBase : Colors.textSoft }]}>
                    {v.label}
                  </Text>
                  <Text style={[styles.diffXp, { color: active ? Colors.bgBase : Colors.textSoft }]}>+{v.xp}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>META AUTOMÁTICA (HEALTH CONNECT)</Text>
          <View style={styles.metricRow}>
            {([
              ['none', 'Nenhuma'],
              ['steps', 'Passos'],
              ['sleep', 'Sono'],
              ['exercise', 'Treino'],
            ] as const).map(([m, label]) => {
              const active = form.metric === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setFormMetric(m)}
                  style={[
                    styles.metricOpt,
                    {
                      backgroundColor: active ? Colors.glowCyan : 'rgba(61,169,252,0.05)',
                      borderColor: active ? Colors.glowCyan : 'rgba(61,169,252,0.2)',
                    },
                  ]}
                >
                  <Text style={[styles.metricText, { color: active ? Colors.bgBase : Colors.textSoft }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          {form.metric !== 'none' && (
            <TextInput
              value={form.metricGoal}
              onChangeText={setFormMetricGoal}
              keyboardType="number-pad"
              placeholder={form.metric === 'steps' ? 'Ex.: 10000 passos' : form.metric === 'sleep' ? 'Ex.: 420 minutos' : 'Ex.: 1 sessão'}
              placeholderTextColor={Colors.label}
              style={[styles.input, { marginBottom: 20 }]}
            />
          )}

          <Text style={styles.fieldLabel}>SIDE-QUEST (OPCIONAL · +10% XP)</Text>
          <TextInput
            value={form.sideQuest}
            onChangeText={setFormSideQuest}
            placeholder="Ex.: 50 abdominais"
            placeholderTextColor={Colors.label}
            style={[styles.input, { marginBottom: 8 }]}
          />
          <Text style={styles.sideHint}>
            Um objetivo extra. Marque-o como feito antes de concluir a quest para ganhar +10% de XP.
          </Text>

          <Pressable onPress={toggleFormMandatory} style={styles.mandRow}>
            <View>
              <Text style={styles.mandTitle}>Obrigatória?</Text>
              <Text style={styles.mandSub}>Gera penalidade se falhar.</Text>
            </View>
            <Text
              style={[
                styles.mandTag,
                {
                  color: form.mandatory ? Colors.redSofter : '#6E84A8',
                  backgroundColor: form.mandatory ? 'rgba(255,45,85,0.12)' : 'rgba(120,150,200,0.08)',
                },
              ]}
            >
              {form.mandatory ? 'Obrigatória' : 'Opcional'}
            </Text>
          </Pressable>

          {editingId && (
            <Pressable onPress={deleteHabit} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>EXCLUIR HÁBITO</Text>
            </Pressable>
          )}

          <View style={styles.footer}>
            <Pressable onPress={closeOverlay} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </Pressable>
            <Pressable onPress={saveHabit} style={{ flex: 1 }}>
              <LinearGradient
                colors={['#3DA9FC', '#1E6FD0']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.createBtn}
              >
                <Text style={styles.createText}>{editingId ? 'SALVAR' : 'CRIAR'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 38, justifyContent: 'flex-end' },
  backdrop: { ...FILL, backgroundColor: 'rgba(3,5,12,0.8)' },
  sheet: {
    maxHeight: '92%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(61,169,252,0.35)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(120,150,200,0.3)', alignSelf: 'center', marginBottom: 16 },
  title: { fontFamily: Fonts.rajBold, fontSize: 24, color: Colors.text, letterSpacing: 0.5, marginBottom: 18 },
  fieldLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 1.5, color: Colors.label, marginBottom: 8 },
  input: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(20,33,58,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.3)',
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.rajMedium,
    marginBottom: 18,
  },
  attrRow: { flexDirection: 'row', gap: 7, marginBottom: 18 },
  attrOpt: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 6, borderWidth: 1 },
  attrOptText: { fontFamily: Fonts.monoBold, fontSize: 12 },
  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  diffOpt: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 6,
    borderWidth: 1,
  },
  diffLabel: { fontFamily: Fonts.rajSemiBold, fontSize: 14 },
  diffXp: { fontFamily: Fonts.monoRegular, fontSize: 11, opacity: 0.85 },
  metricRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  metricOpt: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 6, borderWidth: 1 },
  metricText: { fontFamily: Fonts.rajSemiBold, fontSize: 12 },
  sideHint: { fontFamily: Fonts.chivoRegular, fontSize: 11, color: '#8DA0C2', lineHeight: 15.5, marginBottom: 20 },
  mandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(20,33,58,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.2)',
    marginBottom: 20,
  },
  mandTitle: { fontFamily: Fonts.rajSemiBold, fontSize: 15, color: Colors.text },
  mandSub: { fontFamily: Fonts.chivoRegular, fontSize: 11, color: '#8DA0C2' },
  mandTag: {
    fontFamily: Fonts.monoRegular,
    fontSize: 12,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    letterSpacing: 0.5,
    overflow: 'hidden',
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.4)',
    marginBottom: 10,
  },
  deleteText: { fontFamily: Fonts.rajSemiBold, fontSize: 14, letterSpacing: 1, color: Colors.redSoft },
  footer: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.3)',
  },
  cancelText: { fontFamily: Fonts.rajSemiBold, fontSize: 15, letterSpacing: 1, color: Colors.textSoft },
  createBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    shadowColor: Colors.glow,
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  createText: { fontFamily: Fonts.rajBold, fontSize: 16, letterSpacing: 2, color: '#fff' },
});
