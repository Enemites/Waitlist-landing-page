'use client';

import { useRef, ReactNode, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  children?: ReactNode;
  [key: string]: any;
}

const ScrollExpandMedia = ({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  children,
}: ScrollExpandMediaProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const reduce = useReducedMotion();
  const [externalMediaAllowed, setExternalMediaAllowed] = useState(false);

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

  // Images reveal gently; videos scale as a whole so playback controls remain accessible.
  const initialInsetX = isMobile ? '0%' : '8%';
  const initialInsetY = '0%';

  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    [
      `inset(${initialInsetY} ${initialInsetX} ${initialInsetY} ${initialInsetX} round 8px)`,
      `inset(0% 0% 0% 0% round 8px)`
    ]
  );
  const mediaScale = useTransform(scrollYProgress, [0, 1], [isMobile ? 1 : 0.94, 1]);

  return (
    <div ref={containerRef} className='media-stage relative w-full'>
      <div className='media-stage-inner sticky w-full flex flex-col items-center justify-center bg-transparent'>
        
        {/* The video container locked to its original size (max-w-4xl aspect-video) */}
        <motion.div
          style={reduce ? undefined : mediaType === 'video' ? { scale: mediaScale } : { clipPath }}
          className='relative w-full max-w-5xl aspect-video bg-black shadow-2xl flex items-center justify-center'
        >
          {mediaType === 'video' ? (
            mediaSrc.includes('youtube.com') && !externalMediaAllowed ? (
              <div className='p-6 text-center text-white space-y-4'>
                <p>Playing this video connects to YouTube, which receives your IP address and may process playback data.</p>
                <button type='button' className='border border-white px-5 py-3' onClick={() => setExternalMediaAllowed(true)}>Allow YouTube and play video</button>
              </div>
            ) : mediaSrc.includes('youtube.com') ? (
              <iframe
                title="Enemites introduction video"
                src={
                  mediaSrc.includes('embed')
                    ? mediaSrc.replace("www.youtube.com", "www.youtube-nocookie.com") +
                      (mediaSrc.includes('?') ? '&' : '?') +
                      'controls=1&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                    : mediaSrc.replace('watch?v=', 'embed/').replace('www.youtube.com', 'www.youtube-nocookie.com') +
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
