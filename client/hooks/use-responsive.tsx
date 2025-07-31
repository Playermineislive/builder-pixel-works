import { useState, useEffect } from 'react';

export interface BreakpointValues {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  xxl: boolean;
}

export interface ResponsiveInfo {
  breakpoints: BreakpointValues;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isOnline: boolean;
  devicePixelRatio: number;
  supportsHover: boolean;
  prefersReducedMotion: boolean;
  isTouchDevice: boolean;
}

const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536
};

function getBreakpoints(width: number): BreakpointValues {
  return {
    xs: width >= BREAKPOINTS.xs,
    sm: width >= BREAKPOINTS.sm,
    md: width >= BREAKPOINTS.md,
    lg: width >= BREAKPOINTS.lg,
    xl: width >= BREAKPOINTS.xl,
    xxl: width >= BREAKPOINTS.xxl
  };
}

function detectDeviceCapabilities() {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return {
    isTouchDevice,
    supportsHover,
    prefersReducedMotion
  };
}

export function useResponsive(): ResponsiveInfo {
  const [windowDimensions, setWindowDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  }));

  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [deviceCapabilities] = useState(() => 
    typeof window !== 'undefined' ? detectDeviceCapabilities() : {
      isTouchDevice: false,
      supportsHover: true,
      prefersReducedMotion: false
    }
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const breakpoints = getBreakpoints(windowDimensions.width);
  const orientation = windowDimensions.width > windowDimensions.height ? 'landscape' : 'portrait';
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

  return {
    breakpoints,
    isMobile: windowDimensions.width < BREAKPOINTS.md,
    isTablet: windowDimensions.width >= BREAKPOINTS.md && windowDimensions.width < BREAKPOINTS.lg,
    isDesktop: windowDimensions.width >= BREAKPOINTS.lg,
    isLargeDesktop: windowDimensions.width >= BREAKPOINTS.xl,
    width: windowDimensions.width,
    height: windowDimensions.height,
    orientation,
    isOnline,
    devicePixelRatio,
    ...deviceCapabilities
  };
}

// Utility hook for viewport-specific behavior
export function useViewport() {
  const responsive = useResponsive();
  
  const getOptimalImageSize = () => {
    if (responsive.isMobile) return 'small';
    if (responsive.isTablet) return 'medium';
    return 'large';
  };

  const getOptimalVideoQuality = () => {
    if (responsive.isMobile) return '480p';
    if (responsive.isTablet) return '720p';
    return '1080p';
  };

  const getSafeAreaInsets = () => {
    // For mobile devices with notches or rounded corners
    const style = getComputedStyle(document.documentElement);
    return {
      top: style.getPropertyValue('env(safe-area-inset-top)') || '0px',
      right: style.getPropertyValue('env(safe-area-inset-right)') || '0px',
      bottom: style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
      left: style.getPropertyValue('env(safe-area-inset-left)') || '0px'
    };
  };

  const shouldUseAnimation = () => {
    return !responsive.prefersReducedMotion && responsive.isOnline;
  };

  const getOptimalChatLayout = () => {
    if (responsive.isMobile) {
      return {
        messageMaxWidth: '85%',
        showSidebar: false,
        stackVertically: true,
        compactMode: true,
        showQuickActions: false
      };
    }
    
    if (responsive.isTablet) {
      return {
        messageMaxWidth: '70%',
        showSidebar: responsive.orientation === 'landscape',
        stackVertically: false,
        compactMode: false,
        showQuickActions: true
      };
    }

    return {
      messageMaxWidth: '60%',
      showSidebar: true,
      stackVertically: false,
      compactMode: false,
      showQuickActions: true
    };
  };

  return {
    ...responsive,
    getOptimalImageSize,
    getOptimalVideoQuality,
    getSafeAreaInsets,
    shouldUseAnimation,
    getOptimalChatLayout
  };
}

// Performance optimization hook
export function usePerformanceOptimization() {
  const responsive = useResponsive();
  
  const shouldLazyLoad = responsive.isMobile || !responsive.isOnline;
  const shouldReduceAnimations = responsive.prefersReducedMotion || responsive.isMobile;
  const shouldOptimizeImages = responsive.isMobile || responsive.devicePixelRatio < 2;
  const shouldUseVirtualization = responsive.isMobile; // For long lists
  
  const getOptimalBatchSize = () => {
    if (responsive.isMobile) return 10;
    if (responsive.isTablet) return 20;
    return 50;
  };

  const shouldPreloadContent = () => {
    return responsive.isOnline && !responsive.isMobile;
  };

  return {
    shouldLazyLoad,
    shouldReduceAnimations,
    shouldOptimizeImages,
    shouldUseVirtualization,
    getOptimalBatchSize,
    shouldPreloadContent
  };
}

// Accessibility hook
export function useAccessibility() {
  const responsive = useResponsive();
  
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [largeTextMode, setLargeTextMode] = useState(false);

  useEffect(() => {
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const largeTextQuery = window.matchMedia('(prefers-reduced-data: reduce)');
    
    setHighContrastMode(highContrastQuery.matches);
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setHighContrastMode(e.matches);
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);
    
    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  const getAccessibleTapTargetSize = () => {
    // Minimum 48px for mobile touch targets
    return responsive.isTouchDevice ? '48px' : '32px';
  };

  const shouldUseLargeText = () => {
    return largeTextMode || responsive.isMobile;
  };

  const getOptimalFontSize = () => {
    if (shouldUseLargeText()) {
      return {
        xs: '14px',
        sm: '16px',
        base: '18px',
        lg: '20px',
        xl: '22px'
      };
    }
    
    return {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px'
    };
  };

  return {
    highContrastMode,
    largeTextMode,
    setLargeTextMode,
    getAccessibleTapTargetSize,
    shouldUseLargeText,
    getOptimalFontSize,
    shouldShowTooltips: !responsive.isTouchDevice,
    shouldUseVoiceOver: responsive.isTouchDevice
  };
}

// Network optimization hook
export function useNetworkOptimization() {
  const responsive = useResponsive();
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('4g');

  useEffect(() => {
    // Check if navigator.connection is available (Chrome/Edge)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      setConnectionType(connection.type || 'unknown');
      setEffectiveType(connection.effectiveType || '4g');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || '4g');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
  }, []);

  const isSlowConnection = effectiveType === '2g' || effectiveType === 'slow-2g';
  const isFastConnection = effectiveType === '4g' || effectiveType === '5g';

  const shouldCompressImages = isSlowConnection || !responsive.isOnline;
  const shouldReduceQuality = isSlowConnection;
  const shouldPrefetchContent = isFastConnection && responsive.isOnline;
  
  const getOptimalImageFormat = () => {
    if (isSlowConnection) return 'webp';
    if (isFastConnection) return 'avif';
    return 'jpeg';
  };

  const getOptimalVideoSettings = () => ({
    autoplay: isFastConnection,
    preload: isFastConnection ? 'auto' : 'metadata',
    quality: isSlowConnection ? 'low' : 'high'
  });

  return {
    connectionType,
    effectiveType,
    isSlowConnection,
    isFastConnection,
    shouldCompressImages,
    shouldReduceQuality,
    shouldPrefetchContent,
    getOptimalImageFormat,
    getOptimalVideoSettings,
    isOnline: responsive.isOnline
  };
}
