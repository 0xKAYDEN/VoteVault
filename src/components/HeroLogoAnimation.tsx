import { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface HeroLogoAnimationProps {
  opacity?: number;
  desktopWidth?: number;
  mobileWidth?: number;
}

export const HeroLogoAnimation = ({
  opacity = 0.23,
  desktopWidth = 320,
  mobileWidth = 220,
}: HeroLogoAnimationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load and play Lottie animation
    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/animations/votevault-logo.json',
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
        clearCanvas: true,
        progressiveLoad: true,
        hideOnTransparent: true,
      },
    });

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{
        width: `${mobileWidth}px`,
        height: `${mobileWidth}px`,
        opacity: opacity,
        zIndex: 0,
      }}
    >
      {/* Red glow blur effect */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'scale(1.2)',
        }}
      />

      {/* Lottie animation container */}
      <div
        ref={containerRef}
        className="relative w-full h-full"
        style={{
          mixBlendMode: 'screen',
        }}
      />

      {/* Responsive sizing */}
      <style jsx>{`
        @media (min-width: 768px) {
          div[style*="width: ${mobileWidth}px"] {
            width: ${desktopWidth}px !important;
            height: ${desktopWidth}px !important;
          }
        }
      `}</style>
    </div>
  );
};
