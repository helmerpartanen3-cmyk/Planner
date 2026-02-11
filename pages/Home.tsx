import React from 'react';
import { motion } from 'framer-motion';
import ProjectsList from '../components/ProjectsList';

const Home: React.FC = () => {
  return (
    <main className="min-h-screen">
      
      {/* Hero Section - Full Screen */}
      <section className="h-screen flex flex-col justify-center px-4 md:px-12 relative overflow-hidden">
        
        {/* Absolute technical markers */}
        <div className="absolute top-32 right-8 md:right-12 font-mono text-xs text-right hidden md:block opacity-50">
          <p>60°27'45"N</p>
          <p>24°48'25"E</p>
        </div>

        <div className="w-full max-w-[1800px] mx-auto z-10">
          {/* Staggered Text Reveal */}
          <div className="overflow-hidden">
            <motion.h1 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="font-grotesk text-[14vw] leading-[0.8] font-bold tracking-tighter uppercase mix-blend-exclusion dark:mix-blend-normal"
            >
              Helmer
            </motion.h1>
          </div>
          
          <div className="overflow-hidden flex justify-end md:pr-[10vw]">
             <motion.h1 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="font-grotesk text-[14vw] leading-[0.8] font-bold tracking-tighter uppercase mix-blend-exclusion dark:mix-blend-normal"
            >
              Partanen
            </motion.h1>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-end mt-12 md:mt-24 border-t border-black/10 dark:border-white/10 pt-8">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               transition={{ delay: 0.8, duration: 1 }}
               className="font-mono text-xs md:text-sm uppercase tracking-widest text-gray-500 mb-6 md:mb-0"
             >
               [ Nurmijärvi, FI ]
             </motion.div>

             <motion.p 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               transition={{ delay: 1, duration: 1 }}
               className="font-mono text-xs md:text-sm uppercase tracking-widest text-gray-500 max-w-lg leading-snug text-right"
             >
              Harrastelija joka tykkää luoda erilaisia digitaalisia alustoja.
             </motion.p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">Rullaa alas</span>
          <div className="w-[1px] h-12 bg-black/20 dark:bg-white/20 overflow-hidden">
            <motion.div 
              animate={{ y: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-full h-full bg-black dark:bg-white"
            />
          </div>
        </motion.div>
      </section>

      {/* Projects List - Alternating Layout with Parallax */}
      <ProjectsList />

      <motion.footer 
        id="about"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="px-4 md:px-12 pb-12 pt-32 border-t border-black/10 dark:border-white/10 max-w-[1800px] mx-auto bg-gray-50 dark:bg-gray-900/50"
      >
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-16">
          <div className="max-w-3xl">
            <h2 className="font-grotesk text-7xl md:text-9xl font-bold mb-12 tracking-tighter leading-[0.8]">
              OTA<br/>YHTEYTTÄ
            </h2>
            <div className="flex flex-wrap gap-8 font-mono text-sm uppercase text-gray-500">
               <a href="#" className="hover:text-black dark:hover:text-white transition-colors relative group">
                 Instagram
                 <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-black dark:bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
               </a>
               <a href="#" className="hover:text-black dark:hover:text-white transition-colors relative group">
                 LinkedIn
                 <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-black dark:bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
               </a>
               <a href="#" className="hover:text-black dark:hover:text-white transition-colors relative group">
                 Twitter / X
                 <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-black dark:bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
               </a>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 text-right items-start lg:items-end">
             <a href="mailto:contact@monokromi.fi" className="font-grotesk text-2xl md:text-4xl font-bold hover:text-gray-600 transition-colors">
               contact@monokromi.fi
             </a>
             <p className="font-sans text-base text-gray-500 max-w-sm leading-relaxed">
               Etsitkö kumppania seuraavaan projektiisi?<br/>
               Ota yhteyttä, niin suunnitellaan jotain ainutlaatuista.
             </p>
             <span className="font-mono text-xs text-gray-400 mt-12 block">© 2024 MONOKROMI — HELSINKI</span>
          </div>
        </div>
      </motion.footer>
    </main>
  );
};

export default Home;