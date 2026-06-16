// Widget UIs for react-native-android-widget. These render to Android
// RemoteViews (not real RN), so only the library's FlexWidget/TextWidget +
// the documented style subset are available. Self-contained (no app imports)
// so it renders fine in the headless widget task. HUD aesthetic of the System.
import React from 'react';
import { FlexWidget, TextWidget, type ColorProp } from 'react-native-android-widget';

import type { WidgetData } from './types';

// react-native-android-widget only honors fonts BUNDLED via the plugin's `fonts`
// option (matched by file base name) — built-in Android family aliases silently
// fall back to default. These match the TTFs registered in app.json.
const F_TITLE = 'Rajdhani_700Bold';
const F_TITLE_SOFT = 'Rajdhani_600SemiBold';
const F_MONO = 'JetBrainsMono_400Regular';

const TEXT = '#E6F1FF';
const SOFT = '#9FB2D0';
const LABEL = '#7A8BA8';
const DIM = '#5C7299';
const BLUE = '#3DA9FC';
const RED = '#FF6178';
const TRACK = 'rgba(120, 150, 200, 0.18)' as ColorProp;
const BORDER = 'rgba(61, 169, 252, 0.32)' as ColorProp;
const BG_FROM = '#0E1626';
const BG_TO = '#05070D';

function Bar({ pct, color, height = 7 }: { pct: number; color: ColorProp; height?: number }) {
  const fill = Math.max(0, Math.min(100, pct));
  return (
    <FlexWidget
      style={{
        height,
        width: 'match_parent',
        backgroundColor: TRACK,
        borderRadius: height / 2,
        flexDirection: 'row',
      }}
    >
      <FlexWidget style={{ flex: Math.max(0.001, fill), height, backgroundColor: color, borderRadius: height / 2 }} />
      <FlexWidget style={{ flex: Math.max(0.001, 100 - fill), height }} />
    </FlexWidget>
  );
}

function Card({ children, padding = 14 }: { children: React.ReactNode; padding?: number }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundGradient: { from: BG_FROM, to: BG_TO, orientation: 'TL_BR' },
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        padding,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {children}
    </FlexWidget>
  );
}

function Row({ children, marginBottom = 0 }: { children: React.ReactNode; marginBottom?: number }) {
  return (
    <FlexWidget
      style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom }}
    >
      {children}
    </FlexWidget>
  );
}

function HudWidget({ data }: { data: WidgetData }) {
  const rank = data.rankColor as ColorProp;
  return (
    <Card>
      <Row>
        <TextWidget text="ARISE" style={{ fontSize: 15, color: TEXT, fontFamily: F_TITLE, fontWeight: 'bold', letterSpacing: 2 }} />
        <TextWidget text={`RANK ${data.rank} · Nv ${data.level}`} style={{ fontSize: 12, color: data.rankColor as ColorProp, fontFamily: F_TITLE, fontWeight: 'bold' }} />
      </Row>
      <TextWidget text={data.playerName} maxLines={1} truncate="END" style={{ fontSize: 11, color: SOFT, fontFamily: F_MONO, letterSpacing: 1 }} />
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
        <Row marginBottom={4}>
          <TextWidget text="XP" style={{ fontSize: 10, color: LABEL, fontFamily: F_MONO }} />
          <TextWidget text={`${data.xpCur} / ${data.xpMax}`} style={{ fontSize: 10, color: LABEL, fontFamily: F_MONO }} />
        </Row>
        <Bar pct={data.xpPct} color={BLUE} />
      </FlexWidget>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
        <Row marginBottom={4}>
          <TextWidget text="QUESTS HOJE" style={{ fontSize: 10, color: LABEL, fontFamily: F_MONO, letterSpacing: 1 }} />
          <TextWidget text={`${data.questsDone} / ${data.questsTotal}`} style={{ fontSize: 12, color: TEXT, fontFamily: F_TITLE, fontWeight: 'bold' }} />
        </Row>
        <Bar pct={data.questsPct} color={rank} />
      </FlexWidget>
      <TextWidget
        text={data.penaltyActive ? `[!] PENALIDADE ATIVA · ${data.updatedLabel}` : `Reset em ~${data.resetHours}h · atualizado ${data.updatedLabel}`}
        maxLines={1}
        truncate="END"
        style={{ fontSize: 9, color: data.penaltyActive ? RED : DIM, fontFamily: F_MONO }}
      />
    </Card>
  );
}

function QuestsWidget({ data }: { data: WidgetData }) {
  const rank = data.rankColor as ColorProp;
  const items = data.pending.length > 0 ? data.pending : ['Tudo concluído hoje ✓'];
  return (
    <Card>
      <Row>
        <TextWidget text="[ QUESTS DIÁRIAS ]" style={{ fontSize: 11, color: DIM, fontFamily: F_MONO, letterSpacing: 2 }} />
        <TextWidget text={`${data.questsDone} / ${data.questsTotal}`} style={{ fontSize: 13, color: TEXT, fontFamily: F_TITLE, fontWeight: 'bold' }} />
      </Row>
      <Bar pct={data.questsPct} color={rank} height={8} />
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'column', marginTop: 8 }}>
        {items.slice(0, 4).map((name, i) => (
          <FlexWidget key={i} style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <TextWidget text="•" style={{ fontSize: 13, color: rank, fontFamily: F_MONO, marginRight: 8 }} />
            <TextWidget text={name} maxLines={1} truncate="END" style={{ fontSize: 13, color: SOFT, fontFamily: F_TITLE_SOFT }} />
          </FlexWidget>
        ))}
      </FlexWidget>
      <TextWidget
        text={data.penaltyActive ? `[!] PENALIDADE ATIVA · ${data.updatedLabel}` : `Reset em ~${data.resetHours}h · atualizado ${data.updatedLabel}`}
        maxLines={1}
        truncate="END"
        style={{ fontSize: 9, color: data.penaltyActive ? RED : DIM, fontFamily: F_MONO }}
      />
    </Card>
  );
}

function CompactWidget({ data }: { data: WidgetData }) {
  return (
    <Card padding={12}>
      <Row>
        <TextWidget text={`Nv ${data.level}`} style={{ fontSize: 18, color: TEXT, fontFamily: F_TITLE, fontWeight: 'bold' }} />
        <TextWidget text={`RANK ${data.rank}`} style={{ fontSize: 12, color: data.rankColor as ColorProp, fontFamily: F_TITLE, fontWeight: 'bold', letterSpacing: 1 }} />
      </Row>
      <TextWidget text={`SEQ ${data.bestStreak} dias`} style={{ fontSize: 11, color: SOFT, fontFamily: F_MONO }} />
      <Bar pct={data.xpPct} color={BLUE} />
    </Card>
  );
}

export function renderArise(name: string, data: WidgetData): React.JSX.Element {
  switch (name) {
    case 'AriseQuests':
      return <QuestsWidget data={data} />;
    case 'AriseCompact':
      return <CompactWidget data={data} />;
    case 'AriseHud':
    default:
      return <HudWidget data={data} />;
  }
}
