import React from 'react';
import { projects } from '../data/projects';
import ProjectCard from './ProjectCard';

const ProjectsList: React.FC = () => {
  return (
    <div className="px-4 md:px-12 max-w-[1800px] mx-auto mb-48 flex flex-col gap-40 md:gap-64">
      {projects.map((project, index) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          index={index}
        />
      ))}
    </div>
  );
};

export default ProjectsList;
