import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, FILL } from '@/theme/tokens';
import { useGame } from '@/store/gameStore';
import { IconChevronLeft, IconTrash, IconPlus } from '@/components/ui/icons';
import SystemGuard, { isGuardAvailable, type InstalledApp } from '@/services/softlock/SystemGuard';

export function SealedAppsOverlay() {
  const sealedApps = useGame((s) => s.sealedApps);
  const addSealedApp = useGame((s) => s.addSealedApp);
  const removeSealedApp = useGame((s) => s.removeSealedApp);
  const closeOverlay = useGame((s) => s.closeOverlay);

  const [installed, setInstalled] = useState<InstalledApp[]>([]);
  const [usage, setUsage] = useState(false);
  const [overlay, setOverlayPerm] = useState(false);

  const refresh = useCallback(async () => {
    setUsage(await SystemGuard.hasUsageAccess());
    setOverlayPerm(await SystemGuard.hasOverlayPermission());
    setInstalled(await SystemGuard.listInstalledApps());
  }, []);

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const sealedPkgs = new Set(sealedApps.map((a) => a.package));
  const available = installed.filter((a) => !sealedPkgs.has(a.package));

  const PermRow = ({ label, granted, onGrant }: { label: string; granted: boolean; onGrant: () => void }) => (
    <View style={styles.permRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.permLabel}>{label}</Text>
        <Text style={[styles.permStatus, { color: granted ? Colors.glow : Colors.redSoft }]}>
          {granted ? 'CONCEDIDA' : 'NECESSÁRIA'}
        </Text>
      </View>
      {!granted && (
        <Pressable onPress={onGrant} style={styles.grantBtn}>
          <Text style={styles.grantText}>CONCEDER</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={closeOverlay} style={styles.back}>
            <IconChevronLeft size={13} color="#8DA0C2" />
            <Text style={styles.backText}>Configurações</Text>
          </Pressable>
          <Text style={styles.sysLabel}>[ APPS SELADOS ]</Text>
          <Text style={styles.h1}>Selo do Sistema</Text>
          <Text style={styles.intro}>
            Durante uma penalidade (ou um Gate de Foco), abrir um app selado faz o Sistema reagir:
            overlay de aviso + agravamento do debuff.
          </Text>

          {!isGuardAvailable && (
            <Text style={styles.warn}>
              [ ! ] O bloqueio nativo só funciona no build do app (não no Expo Go).
            </Text>
          )}

          <LinearGradient colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']} start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.card}>
            <Text style={[styles.cardLabel, { marginBottom: 12 }]}>[ PERMISSÕES ]</Text>
            <PermRow label="Acesso de uso (Usage Access)" granted={usage} onGrant={() => SystemGuard.openUsageAccessSettings()} />
            <PermRow label="Sobrepor outros apps (Overlay)" granted={overlay} onGrant={() => SystemGuard.requestOverlayPermission()} />
          </LinearGradient>

          <LinearGradient colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']} start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.card}>
            <Text style={[styles.cardLabel, { marginBottom: 12 }]}>[ SELADOS ({sealedApps.length}) ]</Text>
            {sealedApps.length === 0 && <Text style={styles.muted}>Nenhum app selado ainda.</Text>}
            {sealedApps.map((a) => (
              <View key={a.package} style={styles.appRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appLabel}>{a.label}</Text>
                  <Text style={styles.appPkg}>{a.package}</Text>
                </View>
                <Pressable onPress={() => removeSealedApp(a.package)} hitSlop={8}>
                  <IconTrash size={16} color={Colors.redSoft} />
                </Pressable>
              </View>
            ))}
          </LinearGradient>

          <LinearGradient colors={['rgba(20,33,58,0.5)', 'rgba(8,14,26,0.6)']} start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 1 }} style={[styles.card, { marginBottom: 0 }]}>
            <Text style={[styles.cardLabel, { marginBottom: 12 }]}>[ APPS INSTALADOS ]</Text>
            {available.length === 0 && (
              <Text style={styles.muted}>
                {isGuardAvailable ? 'Conceda o acesso de uso para listar os apps.' : 'Disponível apenas no build nativo.'}
              </Text>
            )}
            {available.map((a) => (
              <View key={a.package} style={styles.appRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appLabel}>{a.label}</Text>
                  <Text style={styles.appPkg}>{a.package}</Text>
                </View>
                <Pressable onPress={() => addSealedApp(a)} style={styles.sealBtn}>
                  <IconPlus size={14} color={Colors.bgBase} />
                </Pressable>
              </View>
            ))}
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
  h1: { fontFamily: Fonts.rajBold, fontSize: 28, color: Colors.text, letterSpacing: 0.5, marginBottom: 8 },
  intro: { fontFamily: Fonts.chivoRegular, fontSize: 12.5, color: '#8DA0C2', lineHeight: 18.5, marginBottom: 14 },
  warn: { fontFamily: Fonts.monoRegular, fontSize: 11, color: Colors.redSoft, marginBottom: 14 },
  card: { borderRadius: 7, padding: 16, borderWidth: 1, borderColor: 'rgba(61,169,252,0.2)', marginBottom: 14 },
  cardLabel: { fontFamily: Fonts.monoRegular, fontSize: 10, letterSpacing: 2, color: Colors.labelDim },
  muted: { fontFamily: Fonts.chivoRegular, fontSize: 12, color: Colors.labelDim },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  permLabel: { fontFamily: Fonts.rajSemiBold, fontSize: 14, color: Colors.text },
  permStatus: { fontFamily: Fonts.monoRegular, fontSize: 9, letterSpacing: 1, marginTop: 2 },
  grantBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(61,169,252,0.4)' },
  grantText: { fontFamily: Fonts.rajSemiBold, fontSize: 12, letterSpacing: 0.5, color: Colors.glow },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: 'rgba(61,169,252,0.08)' },
  appLabel: { fontFamily: Fonts.rajSemiBold, fontSize: 14, color: Colors.text },
  appPkg: { fontFamily: Fonts.monoRegular, fontSize: 9, color: Colors.labelDim, marginTop: 1 },
  sealBtn: { width: 30, height: 30, borderRadius: 6, backgroundColor: Colors.glow, alignItems: 'center', justifyContent: 'center' },
});
