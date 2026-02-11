import React, { useRef } from 'react';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax Logic
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  const isTextLeft = index % 2 === 0;

  const containerVariant: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)",
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  const textRevealVariant: Variants = {
    hidden: { y: "100%" },
    visible: {
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div
      ref={containerRef}
      variants={containerVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      className={`flex flex-col md:flex-row gap-8 md:gap-24 items-center w-full group ${
        isTextLeft ? '' : 'md:flex-row-reverse'
      }`}
    >
      {/* TEXT SECTION */}
      <div className="w-full md:w-5/12 flex flex-col items-start space-y-8 z-10 mix-blend-difference text-black dark:text-white dark:mix-blend-normal">
        <div className="w-full">
          <div className="flex justify-between items-baseline mb-4 border-b border-current pb-4">
            <div className="overflow-hidden">
              <motion.span
                variants={textRevealVariant}
                className="block font-mono text-xs uppercase tracking-widest opacity-60"
              >
                0{index + 1}
              </motion.span>
            </div>
            <div className="overflow-hidden">
              <motion.span
                variants={textRevealVariant}
                className="block font-mono text-xs uppercase tracking-widest opacity-60"
              >
                {project.year}
              </motion.span>
            </div>
          </div>

          <Link to={`/project/${project.slug}`} className="block">
            <div className="overflow-hidden">
              <motion.h2
                variants={textRevealVariant}
                className="font-grotesk text-5xl md:text-7xl font-bold leading-[0.9] uppercase tracking-tighter transition-all duration-300"
              >
                {project.title}
              </motion.h2>
            </div>
          </Link>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden">
            <motion.p
              variants={textRevealVariant}
              className="font-sans text-xl leading-relaxed max-w-md opacity-90"
            >
              {project.description}
            </motion.p>
          </div>

          <div className="flex flex-wrap gap-3">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="px-4 py-2 border border-current rounded-full text-xs font-mono uppercase tracking-wider"
            >
              {project.role}
            </motion.span>

            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="px-4 py-2 border border-current rounded-full text-xs font-mono uppercase tracking-wider"
            >
              {project.client}
            </motion.span>
          </div>

          <Link
            to={`/project/${project.slug}`}
            className="inline-flex items-center gap-3 pt-4 font-grotesk font-bold uppercase tracking-widest text-sm group/link"
          >
            <span className="relative">
              Katso Projekti
              <span className="absolute left-0 bottom-0 w-full h-[1px] bg-current transform scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left"></span>
            </span>

            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              whileHover={{ x: 5 }}
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </motion.svg>
          </Link>
        </div>
      </div>

      {/* IMAGE SECTION */}
      <div className="w-full md:w-7/12 perspective-1000">
        <Link
          to={`/project/${project.slug}`}
          className="block w-full h-full relative rounded-2xl"
        >
          <motion.div
            style={{ y }}
            className="w-full relative rounded-2xl overflow-hidden bg-white dark:bg-black"
            whileHover={{ scale: 0.98 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.img
              layoutId={`project-image-${project.id}`}
              src={project.thumbnail}
              alt={project.title}
              className="w-full h-auto block grayscale group-hover:grayscale-0 transition-all duration-700 ease-out"
            />

            {/* Subtle texture overlay */}
            <div className="absolute inset-0 bg-black/5 dark:bg-white/5 pointer-events-none" />
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
};

export default ProjectCard;