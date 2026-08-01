'use client';

import { useRef, ReactNode, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  children?: ReactNode;
}

const ScrollExpandMedia = ({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  children,
}: ScrollExpandMediaProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Calculate the crop amount. 
  // On desktop, we inset heavily left/right to make it square-like.
  // On mobile, less inset left/right so it doesn't get too skinny.
  const initialInsetX = isMobile ? '20%' : '35%';
  const initialInsetY = isMobile ? '20%' : '15%';

  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    [
      `inset(${initialInsetY} ${initialInsetX} ${initialInsetY} ${initialInsetX} round 24px)`,
      `inset(0% 0% 0% 0% round 12px)`
    ]
  );

  return (
    <div ref={containerRef} className='relative w-full h-[150vh]'>
      <div className='sticky top-0 w-full h-screen flex flex-col items-center justify-center bg-transparent px-4 pt-16 md:pt-24'>
        
        {/* The video container locked to its original size (max-w-4xl aspect-video) */}
        <motion.div
          style={{ clipPath }}
          className='relative w-full max-w-5xl aspect-video bg-black shadow-2xl flex items-center justify-center'
        >
          {mediaType === 'video' ? (
            mediaSrc.includes('youtube.com') ? (
              <iframe
                src={
                  mediaSrc.includes('embed')
                    ? mediaSrc +
                      (mediaSrc.includes('?') ? '&' : '?') +
                      'controls=1&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                    : mediaSrc.replace('watch?v=', 'embed/') +
                      '?controls=1&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                      mediaSrc.split('v=')[1]
                }
                className='w-full h-full pointer-events-auto'
                frameBorder='0'
                allow='accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                allowFullScreen
              />
            ) : (
              <video
                src={mediaSrc}
                poster={posterSrc}
                playsInline
                preload='auto'
                className='w-full h-full object-cover pointer-events-auto'
                controls={true}
                disablePictureInPicture
                disableRemotePlayback
              />
            )
          ) : (
            <img
              src={mediaSrc}
              alt='Media content'
              className='w-full h-full object-cover pointer-events-none'
            />
          )}
        </motion.div>

        {/* Optional children to show below or on top */}
        {children && (
          <motion.div 
            className='absolute bottom-10 w-full flex justify-center pointer-events-auto'
            style={{ opacity: scrollYProgress }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ScrollExpandMedia;
