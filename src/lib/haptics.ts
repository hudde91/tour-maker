/**
 * Haptic feedback utilities for native-feeling interactions
 * Works with Tauri's native capabilities
 */

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

/**
 * Trigger haptic feedback if available (Tauri/native platform)
 */
export const triggerHaptic = (type: HapticFeedbackType = 'light'): void => {
  // Check if running in Tauri
  if (typeof window !== 'undefined' && window.__TAURI__) {
    // In Tauri, we can use the platform's native haptic feedback
    try {
      // For mobile platforms, trigger haptic feedback
      if ('vibrate' in navigator) {
        const patterns: Record<HapticFeedbackType, number | number[]> = {
          light: 10,
          medium: 20,
          heavy: 30,
          success: [10, 50, 10],
          warning: [10, 100, 10],
          error: [30, 50, 30],
          selection: 5,
        };

        const pattern = patterns[type];
        navigator.vibrate(pattern);
      }
    } catch (error) {
      // Silently fail if haptics not supported
      console.debug('Haptic feedback not available:', error);
    }
  } else if ('vibrate' in navigator) {
    // Fallback for web browsers with vibration API
    const patterns: Record<HapticFeedbackType, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      warning: [10, 100, 10],
      error: [30, 50, 30],
      selection: 5,
    };

    const pattern = patterns[type];
    navigator.vibrate(pattern);
  }
};

/**
 * Trigger a selection haptic (very light feedback)
 */
export const hapticSelection = () => triggerHaptic('selection');

/**
 * Trigger a light impact haptic
 */
export const hapticLight = () => triggerHaptic('light');

/**
 * Trigger a medium impact haptic
 */
export const hapticMedium = () => triggerHaptic('medium');

/**
 * Trigger a heavy impact haptic
 */
export const hapticHeavy = () => triggerHaptic('heavy');

/**
 * Trigger a success notification haptic
 */
export const hapticSuccess = () => triggerHaptic('success');

/**
 * Trigger a warning notification haptic
 */
export const hapticWarning = () => triggerHaptic('warning');

/**
 * Trigger an error notification haptic
 */
export const hapticError = () => triggerHaptic('error');
