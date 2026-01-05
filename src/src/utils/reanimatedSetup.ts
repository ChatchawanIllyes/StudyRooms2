// Initialize react-native-reanimated safely
// This ensures reanimated is available when react-native-tab-view needs it
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  try {
    const reanimated = require('react-native-reanimated');
    // Force initialization by accessing the module
    if (reanimated && reanimated.default) {
      reanimated.default;
    }
  } catch (error) {
    // Silently fail if reanimated isn't available
    console.warn('react-native-reanimated not available:', error);
  }
}

