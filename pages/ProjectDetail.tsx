import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { projects } from '../data/projects';
import VideoPlayer from '../components/VideoPlayer';

const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const project = projects.find((p) => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-grotesk mb-4">404</h1>
          <p className="mb-8">Projektia ei löytynyt</p>
          <button onClick={() => navigate('/')} className="underline">Palaa etusivulle</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-32 overflow-x-hidden">
      
      {/* 1. HERO SECTION - Full viewport height with text overlay */}
      <div className="w-full h-screen relative bg-gray-100 dark:bg-black overflow-hidden flex items-center">
        {/* Background Image */}
        <motion.img 
          layoutId={`project-image-${project.id}`}
          src={project.thumbnail} 
          alt={project.title} 
          className="absolute inset-0 w-full h-full object-cover"
          transition={{ 
            duration: 0.8, 
            ease: [0.6, 0.01, -0.05, 0.9] 
          }}
        />
        
        {/* Overlay Gradient for better text contrast */}
        <div className="absolute inset-0 backdrop-blur-sm dark:bg-gradient-to-b from-black/40 via-black/20 to-black pointer-events-none" />
        
        {/* Text Content Overlay */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col gap-8 md:gap-12"
          >
            {/* Title Area */}
            <div className="border-b border-white/30 pb-8 md:pb-12">
              <h1 className="font-grotesk text-5xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.9] mb-8 text-white">
                {project.title}
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 font-mono text-xs md:text-sm uppercase tracking-widest text-white/70 max-w-2xl">
                <div>
                  <span className="block opacity-50 mb-1">Vuosi</span>
                  <span className="text-white">{project.year}</span>
                </div>
                <div>
                  <span className="block opacity-50 mb-1">Asiakas</span>
                  <span className="text-white">{project.client}</span>
                </div>
                <div>
                  <span className="block opacity-50 mb-1">Rooli</span>
                  <span className="text-white">{project.role}</span>
                </div>
              </div>
            </div>

            {/* Main Description - Narrower column for better reading experience */}
            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-10 md:col-start-1">
                <p className="font-mono text-xl md:text-3xl leading-relaxed md:leading-tight font-light text-white">
                  {project.fullDescription}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. EDITORIAL GALLERY - 12 Column Grid System */}
      <div className="flex flex-col gap-24 md:gap-32 px-6 md:px-12 max-w-6xl mx-auto py-24 md:py-32 bg-white dark:bg-black text-black dark:text-white">
        {project.gallery.map((media, index) => {
          
          const isFullWidth = media.className?.includes('col-span-2');
          const isLeftAligned = index % 2 === 0;

          // Common Media Component
          const MediaElement = (
            <div className={`w-full relative overflow-hidden bg-gray-100 dark:bg-gray-900 ${media.className || 'aspect-square'}`}>
               {media.type === 'video' ? (
                  <VideoPlayer src={media.src} />
               ) : (
                  <img src={media.src} alt="" className="w-full h-full object-contain" />
               )}
            </div>
          );

          // Common Caption Component
          const CaptionElement = media.caption ? (
            <div className="flex flex-col justify-center h-full">
              <div className="w-8 h-[1px] bg-black dark:bg-white mb-6 opacity-30"></div>
              <p className="font-mono text-lg leading-relaxed text-black dark:text-white">
                {media.caption}
              </p>
              <span className="font-mono text-xs uppercase tracking-widest text-gray-400 mt-4">
                Kuva 0{index + 1}
              </span>
            </div>
          ) : null;

          if (isFullWidth) {
            // --- FULL WIDTH LAYOUT (Centered in 6xl container) ---
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8 }}
                className="w-full"
              >
                {MediaElement}
                {media.caption && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                     <div className="md:col-span-6 md:col-start-1">
                        <p className="font-mono text-sm md:text-base leading-relaxed text-black dark:text-white opacity-70">{media.caption}</p>
                     </div>
                  </div>
                )}
              </motion.div>
            );
          } else {
            // --- SPLIT LAYOUT (12 Col Grid) ---
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-0 items-center"
              >
                {/* 
                   Layout Strategy:
                   Image takes 7 columns.
                   Text takes 4 columns.
                   1 column gap/whitespace.
                */}
                
                {/* Image Column */}
                <div className={`
                  w-full md:col-span-7 
                  ${isLeftAligned ? 'md:col-start-1 md:order-1' : 'md:col-start-6 md:order-2'}
                `}>
                  {MediaElement}
                </div>

                {/* Text Column */}
                <div className={`
                  w-full md:col-span-4
                  ${isLeftAligned ? 'md:col-start-9 md:order-2' : 'md:col-start-1 md:order-1'}
                `}>
                   {CaptionElement}
                </div>
              </motion.div>
            );
          }
        })}
      </div>

      {/* 4. FOOTER / NAVIGATION */}
      <div className="mt-48 text-center border-t border-black/10 dark:border-white/10 pt-24 max-w-6xl mx-auto px-6">
        <Link 
          to="/" 
          className="inline-block group"
        >
          <span className="font-grotesk text-2xl md:text-3xl font-bold uppercase tracking-tighter transition-all">
            Takaisin Etusivulle
          </span>
          <div className="w-full h-[1px] bg-black dark:bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center mt-4"></div>
        </Link>
      </div>
    </div>
  );
};

export default ProjectDetail;