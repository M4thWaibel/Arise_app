import { Redirect } from 'expo-router';
import { useGame } from '@/store/gameStore';

// Onboarding gate: first launch (no profile) → onboarding; otherwise the app.
export default function Index() {
  const hasProfile = useGame((s) => s.profile !== null);
  return <Redirect href={hasProfile ? '/main' : '/onboarding'} />;
}
