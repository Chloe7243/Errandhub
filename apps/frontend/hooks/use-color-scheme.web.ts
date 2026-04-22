import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web-only variant of useColorScheme that defers to the device value only
 * after hydration. During static rendering the hook returns "light" so the
 * server-rendered HTML matches the pre-hydration React tree; once the
 * client mounts it switches to the real react-native useColorScheme value.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
