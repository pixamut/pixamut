import { useState, useEffect } from 'react';
import { isDesktop, isMobile, isIOS, isAndroid } from '../utils/platform';

/**
 * Hook to detect the current platform
 * @returns Object with platform detection methods
 */
export const usePlatform = () => {
  const [platform, setPlatform] = useState({
    isDesktop: isDesktop(),
    isMobile: isMobile(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
  });

  useEffect(() => {
    // Update platform info on mount
    setPlatform({
      isDesktop: isDesktop(),
      isMobile: isMobile(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
    });
  }, []);

  return platform;
};

// Default export for easier importing
export default usePlatform; 