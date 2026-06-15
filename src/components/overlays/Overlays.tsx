import React from 'react';
import { useGame } from '@/store/gameStore';
import { QuestXpFloat } from './QuestXpFloat';
import { LevelUpOverlay } from './LevelUpOverlay';
import { DistributeOverlay } from './DistributeOverlay';
import { PenaltyOverlay } from './PenaltyOverlay';
import { DungeonDetailOverlay } from './DungeonDetailOverlay';
import { CreateHabitOverlay } from './CreateHabitOverlay';
import { SettingsOverlay } from './SettingsOverlay';
import { SealedAppsOverlay } from './SealedAppsOverlay';
import { FocusGateOverlay } from './FocusGateOverlay';

// Renders global system overlays + FX above the navigator, driven by store flags.
export function Overlays() {
  const overlay = useGame((s) => s.overlay);
  const levelUp = useGame((s) => s.levelUp);

  return (
    <>
      <QuestXpFloat />
      {overlay === 'dungeon' && <DungeonDetailOverlay />}
      {overlay === 'settings' && <SettingsOverlay />}
      {overlay === 'sealed' && <SealedAppsOverlay />}
      {overlay === 'focusgate' && <FocusGateOverlay />}
      {overlay === 'distribute' && <DistributeOverlay />}
      {overlay === 'create' && <CreateHabitOverlay />}
      {overlay === 'penalty' && <PenaltyOverlay />}
      {levelUp && <LevelUpOverlay />}
    </>
  );
}
