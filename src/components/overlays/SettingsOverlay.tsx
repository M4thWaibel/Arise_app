import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, Fonts, FILL } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';
import { IconChevronLeft, IconChevronRight, IconTrash } from '@/components/ui/icons';
import { loginAndSync, logoutSync, syncNow } from '@/sync/syncEngine';
import { ensurePermissions as connectHealthConnect } from '@/services/health/HealthService';
import { startHealthSync } from '@/services/health/metricQuests';

const TZ_OPTIONS = ['UTC−3 · Brasília', 'UTC−2 · Fern. de Noronha', 'UTC−4 · Manaus'];
const SEX_OPTIONS: [string, string][] = [
  ['M', 'Masculino'],
  ['F', 'Feminino'],
  ['O', 'Outro'],
];

export function SettingsOverlay() {
  const router = useRouter();
  const setupForm = useGame((s) => s.setupForm);
  const setupError = useGame((s) => s.setupError);
  const setSetupField = useGame((s) => s.setSetupField);
  const saveProfile = useGame((s) => s.saveProfile);
  const recalibrate = useGame((s) => s.recalibrate);
  const tz = useGame((s) => s.tz);
  const setTz = useGame((s) => s.setTz);
  const redoOnboarding = useGame((s) => s.redoOnboarding);
  const clearExample = useGame((s) => s.clearExample);
  const closeOverlay = useGame((s) => s.closeOverlay);
  const openSealed = useGame((s) => s.openSealed);
  const openFocusGate = useGame((s) => s.openFocusGate);
  const sealedCount = useGame((s) => s.sealedApps.length);

  const apiUrl = useGame((s) => s.apiUrl);
  const setApiUrl = useGame((s) => s.setApiUrl);
  const syncAccount = useGame((s) => s.syncAccount);
  const lastSyncAt = useGame((s) => s.lastSyncAt);
  const syncing = useGame((s) => s.syncing);

  const [cloudUser, setCloudUser] = useState('');
  const [cloudPass, setCloudPass] = useState('');
  const [cloudMsg, setCloudMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onRedo = () => {
    redoOnboarding();
    router.replace('/onboarding');
  };

  const runCloud = async (fn: () => Promise<{ ok: boolean; error?: string; direction?: string }>) => {
    setBusy(true);
    setCloudMsg(null);
    const res = await fn();
    setBusy(false);
    setCloudMsg(res.ok ? (res.direction === 'pull' ? 'Dados restaurados da nuvem.' : 'Sincronizado.') : res.error ?? 'Falha.');
  };

  const onAuth = (register: boolean) => {
    if (!cloudUser.trim() || !cloudPass.trim()) {
      setCloudMsg('Preencha usuário e senha.');
      return;
    }
    void runCloud(() => loginAndSync(cloudUser.trim(), cloudPass, register));
  };

  const onLogout = async () => {
    await logoutSync();
    setCloudMsg(null);
  };

  const [healthMsg, setHealthMsg] = useState<string | null>(null);
  const onConnectHealth = async () => {
    setHealthMsg('Abrindo o Health Connect…');
    const granted = await connectHealthConnect();
    if (granted) {
      startHealthSync();
      setHealthMsg('Conectado! Quests com meta de passos/sono/treino se autocompletam.');
    } else {
      setHealthMsg('Indisponível ou permissão negada. Instale/abra o app Health Connect.');
    }
  };

  const lastSyncLabel =
    lastSyncAt > 0 ? new Date(lastSyncAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—';

  const nameBorder = setupError && !setupForm.name.trim() ? Colors.redAlert : 'rgba(61,169,252,0.3)';

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable onPress={closeOverlay} style={styles.back}>
            <IconChevronLeft size={13} color="#8DA0C2" />
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>

          <Text style={styles.sysLabel}>[ CONFIGURAÇÕES ]</Text>
          <Text style={styles.h1}>Perfil &amp; Sistema</Text>

          {/* PERFIL */}
          <LinearGradient colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']} start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.card}>
            <Text style={styles.cardLabel}>[ PERFIL ]</Text>

            <Text style={styles.fieldLabel}>NOME</Text>
            <TextInput
              value={setupForm.name}
              onChangeText={(v) => setSetupField('name', v)}
              placeholder="Seu nome"
              placeholderTextColor={Colors.label}
              style={[styles.input, { borderColor: nameBorder, marginBottom: 16 }]}
            />

            <Text style={styles.fieldLabel}>SEXO</Text>
            <View style={styles.sexRow}>
              {SEX_OPTIONS.map(([v, l]) => {
                const active = setupForm.sex === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => setSetupField('sex', v)}
                    style={[
                      styles.sexOpt,
                      {
                        backgroundColor: active ? Colors.glow : 'rgba(61,169,252,0.05)',
                        borderColor: active ? Colors.glow : 'rgba(61,169,252,0.2)',
                      },
                    ]}
                  >
                    <Text style={[styles.sexLabel, { color: active ? Colors.bgBase : Colors.textSoft }]}>{l}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.threeRow}>
              {([
                ['age', 'IDADE'],
                ['weight', 'PESO'],
                ['height', 'ALTURA'],
              ] as const).map(([key, label]) => (
                <View key={key} style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    value={setupForm[key]}
                    onChangeText={(v) => setSetupField(key, v)}
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.label}
                    style={styles.inputSmall}
                  />
                </View>
              ))}
            </View>

            <View style={styles.profileBtns}>
              <Pressable onPress={saveProfile} style={{ flex: 1 }}>
                <LinearGradient colors={['#3DA9FC', '#1E6FD0']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.saveBtn}>
                  <Text style={styles.saveText}>SALVAR</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={recalibrate} style={styles.recalBtn}>
                <Text style={styles.recalText}>RECALIBRAR</Text>
              </Pressable>
            </View>
            <Text style={styles.help}>Recalibrar recalcula seus 5 atributos a partir de idade, sexo e peso.</Text>
          </LinearGradient>

          {/* FUSO HORÁRIO */}
          <LinearGradient colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']} start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.card}>
            <Text style={[styles.cardLabel, { marginBottom: 12 }]}>[ FUSO HORÁRIO ]</Text>
            <View style={{ gap: 8 }}>
              {TZ_OPTIONS.map((z) => {
                const active = tz === z;
                return (
                  <Pressable
                    key={z}
                    onPress={() => setTz(z)}
                    style={[
                      styles.tzOpt,
                      {
                        backgroundColor: active ? 'rgba(61,169,252,0.14)' : 'rgba(61,169,252,0.04)',
                        borderColor: active ? Colors.glow : 'rgba(61,169,252,0.2)',
                      },
                    ]}
                  >
                    <Text style={[styles.tzLabel, { color: active ? Colors.text : '#8DA0C2' }]}>{z}</Text>
                  </Pressable>
                );
              })}
            </View>
          </LinearGradient>

          {/* NUVEM / SINCRONIZAÇÃO */}
          <LinearGradient colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']} start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.card}>
            <Text style={[styles.cardLabel, { marginBottom: 12 }]}>[ NUVEM / SINCRONIZAÇÃO ]</Text>
            <Text style={styles.fieldLabel}>SERVIDOR (URL)</Text>
            <TextInput
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="http://192.168.0.10:8000"
              placeholderTextColor={Colors.label}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[styles.input, { marginBottom: 14 }]}
            />

            {syncAccount ? (
              <>
                <View style={styles.accountRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountName}>Conectado: {syncAccount}</Text>
                    <Text style={styles.accountSub}>Última sync: {lastSyncLabel}</Text>
                  </View>
                  {syncing && <ActivityIndicator color={Colors.glow} />}
                </View>
                <View style={styles.profileBtns}>
                  <Pressable onPress={() => void runCloud(syncNow)} disabled={busy} style={{ flex: 1 }}>
                    <LinearGradient colors={['#3DA9FC', '#1E6FD0']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.saveBtn}>
                      <Text style={styles.saveText}>SINCRONIZAR AGORA</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable onPress={onLogout} style={styles.recalBtn}>
                    <Text style={[styles.recalText, { color: Colors.redSoft }]}>SAIR</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>USUÁRIO</Text>
                <TextInput
                  value={cloudUser}
                  onChangeText={setCloudUser}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="seu usuário"
                  placeholderTextColor={Colors.label}
                  style={[styles.input, { marginBottom: 12 }]}
                />
                <Text style={styles.fieldLabel}>SENHA</Text>
                <TextInput
                  value={cloudPass}
                  onChangeText={setCloudPass}
                  secureTextEntry
                  placeholder="••••••"
                  placeholderTextColor={Colors.label}
                  style={[styles.input, { marginBottom: 14 }]}
                />
                <View style={styles.profileBtns}>
                  <Pressable onPress={() => onAuth(false)} disabled={busy} style={{ flex: 1 }}>
                    <LinearGradient colors={['#3DA9FC', '#1E6FD0']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.saveBtn}>
                      <Text style={styles.saveText}>ENTRAR</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable onPress={() => onAuth(true)} disabled={busy} style={styles.recalBtn}>
                    <Text style={styles.recalText}>CRIAR CONTA</Text>
                  </Pressable>
                </View>
              </>
            )}
            {cloudMsg && <Text style={styles.help}>{busy ? 'Conectando…' : cloudMsg}</Text>}
            <Text style={styles.help}>
              O app funciona offline. A nuvem serve para backup e sincronizar entre aparelhos.
            </Text>
          </LinearGradient>

          {/* HEALTH CONNECT */}
          <LinearGradient colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']} start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.card}>
            <Text style={[styles.cardLabel, { marginBottom: 12 }]}>[ HEALTH CONNECT ]</Text>
            <Text style={styles.help}>
              Conecte para quests com meta automática (passos, sono, treino) se autocompletarem sozinhas.
            </Text>
            <Pressable onPress={onConnectHealth} style={{ marginTop: 12 }}>
              <LinearGradient colors={['#00C2FF', '#1E6FD0']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.saveBtn}>
                <Text style={styles.saveText}>CONECTAR HEALTH CONNECT</Text>
              </LinearGradient>
            </Pressable>
            {healthMsg && <Text style={styles.help}>{healthMsg}</Text>}
          </LinearGradient>

          {/* SOFT-LOCK */}
          <LinearGradient colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']} start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.card}>
            <Text style={[styles.cardLabel, { marginBottom: 12 }]}>[ SOFT-LOCK ]</Text>
            <Pressable onPress={openSealed} style={styles.sysRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sysRowTitle}>Apps Selados</Text>
                <Text style={styles.sysRowSub}>{sealedCount} selado(s) · vigiados na penalidade.</Text>
              </View>
              <IconChevronRight size={13} color="#7A8BA8" />
            </Pressable>
            <Pressable onPress={openFocusGate} style={[styles.sysRow, { marginBottom: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sysRowTitle}>Gate de Foco</Text>
                <Text style={styles.sysRowSub}>Selo voluntário por tempo → XP de Percepção.</Text>
              </View>
              <IconChevronRight size={13} color="#7A8BA8" />
            </Pressable>
          </LinearGradient>

          {/* SISTEMA */}
          <LinearGradient colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']} start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 1 }} style={[styles.card, { marginBottom: 0 }]}>
            <Text style={[styles.cardLabel, { marginBottom: 12 }]}>[ SISTEMA ]</Text>
            <Pressable onPress={onRedo} style={styles.sysRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sysRowTitle}>Refazer onboarding</Text>
                <Text style={styles.sysRowSub}>Reabre a introdução e o registro do Caçador.</Text>
              </View>
              <IconChevronRight size={13} color="#7A8BA8" />
            </Pressable>
            <Pressable onPress={clearExample} style={styles.dangerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dangerTitle}>Limpar dados de exemplo</Text>
                <Text style={styles.dangerSub}>Remove quests, dungeons e penalidade de exemplo.</Text>
              </View>
              <IconTrash size={16} color={Colors.redSoft} />
            </Pressable>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 37, backgroundColor: Colors.bgBase },
  scroll: { padding: 18, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16, alignSelf: 'flex-start' },
  backText: { color: '#8DA0C2', fontFamily: Fonts.rajSemiBold, fontSize: 14 },
  sysLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 3, color: Colors.labelDim, marginBottom: 4 },
  h1: { fontFamily: Fonts.rajBold, fontSize: 28, color: Colors.text, letterSpacing: 0.5, marginBottom: 20 },

  card: {
    borderRadius: 7,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.2)',
    marginBottom: 14,
  },
  cardLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 2, color: Colors.labelDim, marginBottom: 14 },
  fieldLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 1.5, color: Colors.label, marginBottom: 7 },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(8,14,26,0.5)',
    borderWidth: 1,
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.rajMedium,
  },
  sexRow: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  sexOpt: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 6, borderWidth: 1 },
  sexLabel: { fontFamily: Fonts.rajSemiBold, fontSize: 13 },
  threeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  inputSmall: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(8,14,26,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.25)',
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.rajSemiBold,
  },
  profileBtns: { flexDirection: 'row', gap: 8 },
  saveBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: 6 },
  saveText: { fontFamily: Fonts.rajBold, fontSize: 14, letterSpacing: 1, color: '#fff' },
  recalBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.4)',
  },
  recalText: { fontFamily: Fonts.rajSemiBold, fontSize: 14, letterSpacing: 0.5, color: Colors.purpleLight },
  help: { fontFamily: Fonts.chivoRegular, fontSize: 11, color: Colors.labelDim, marginTop: 10, lineHeight: 15.4 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  accountName: { fontFamily: Fonts.rajSemiBold, fontSize: 15, color: Colors.text },
  accountSub: { fontFamily: Fonts.monoRegular, fontSize: 10, color: Colors.label, marginTop: 2 },

  tzOpt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 13, borderRadius: 6, borderWidth: 1 },
  tzLabel: { fontFamily: Fonts.rajMedium, fontSize: 13.5 },

  sysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(8,14,26,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(61,169,252,0.2)',
    marginBottom: 9,
  },
  sysRowTitle: { fontFamily: Fonts.rajSemiBold, fontSize: 15, color: Colors.text },
  sysRowSub: { fontFamily: Fonts.chivoRegular, fontSize: 11, color: '#8DA0C2' },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(40,8,14,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.35)',
  },
  dangerTitle: { fontFamily: Fonts.rajSemiBold, fontSize: 15, color: Colors.redSofter },
  dangerSub: { fontFamily: Fonts.chivoRegular, fontSize: 11, color: '#C29AA6' },
});
