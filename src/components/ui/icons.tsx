import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

// ---- Gear (settings) ----
export function IconGear({ size = 15, color = '#9FB2D0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={1.6} />
      <Path
        d="M12 2v3.2M12 18.8V22M2 12h3.2M18.8 12H22M4.9 4.9l2.26 2.26M16.84 16.84l2.26 2.26M19.1 4.9l-2.26 2.26M7.16 16.84L4.9 19.1"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ---- Trash (clear data) ----
export function IconTrash({ size = 16, color = '#FF6178' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M3 4.5h10M6 4.5V3h4v1.5M5 4.5l.6 8.5h4.8L11 4.5"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ---- Bottom nav (stroke icons, viewBox 22) ----
export function IconStatus({ size = 22, color = '#3DA9FC' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path d="M11 2l8 4.5v9L11 20l-8-4.5v-9z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconQuests({ size = 22, color = '#3DA9FC' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M4 6l2.2 2.2L10 4.5M4 15l2.2 2.2L10 13.5M13 6.5h6M13 15.5h6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconDungeons({ size = 22, color = '#3DA9FC' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M4 19V9a7 7 0 0114 0v10M4 19h14M9.5 19v-5a1.5 1.5 0 013 0v5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconTitles({ size = 22, color = '#3DA9FC' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M11 2l2.5 5.6 6 .5-4.6 4 1.5 5.9L11 20l-5.4 3 1.5-5.9-4.6-4 6-.5z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ---- Checkmark (filled-state check, dark stroke over colored bg) ----
export function IconCheck({ size = 15, color = '#05070D', strokeWidth = 2.2 }: IconProps & { strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Path d="M3 7.5l3 3 6-7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCheckThin({ size = 16, color = '#00C2FF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M3 8.5l3 3 7-7.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---- Plus (FAB) ----
export function IconPlus({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path d="M11 4v14M4 11h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

// ---- Chevrons ----
export function IconChevronRight({ size = 13, color = '#FF6178' }: IconProps) {
  return (
    <Svg width={(size * 8) / 13} height={size} viewBox="0 0 8 13" fill="none">
      <Path d="M1.5 1.5L6 6.5l-4.5 5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconChevronLeft({ size = 13, color = '#8DA0C2' }: IconProps) {
  return (
    <Svg width={(size * 8) / 13} height={size} viewBox="0 0 8 13" fill="none">
      <Path d="M6.5 1.5L2 6.5l4.5 5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

// ---- Star (filled, equipped title chip / rank) ----
export function IconStar({ size = 11, color = '#3DA9FC' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 11 11">
      <Path d="M5.5 0l1.5 3.4 3.5.3-2.7 2.3.9 3.5L5.5 7.9 2.3 9.8l.9-3.5L.5 4l3.5-.3z" fill={color} />
    </Svg>
  );
}

// ---- Warning triangle (penalty loss note) ----
export function IconWarning({ size = 16, color = '#FF6178' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M8 1l7 13H1z" fill="none" stroke={color} strokeWidth={1.3} />
      <Path d="M8 6v4M8 11.5v.5" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

// ---- Sparkle / star outline (onboarding info note) ----
export function IconSparkle({ size = 16, color = '#3DA9FC' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 1.5l1.9 4.2 4.6.4-3.5 3 1.1 4.4L8 11.1 3.9 13.5l1.1-4.4-3.5-3 4.6-.4z"
        stroke={color}
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
