import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Return a colour value appropriate for the active theme.
 *
 * Callers pass an optional { light, dark } override and a named token from
 * the Colors palette. If an override is provided for the active theme it
 * wins; otherwise the palette value is returned. Used by the Themed*
 * components so screen code can opt into one-off colours without losing
 * dark-mode support.
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
