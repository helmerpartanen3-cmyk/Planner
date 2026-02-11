export interface ProjectMedia {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  caption?: string; // Editorial description for the specific media item
  className?: string; // For layout spans (col-span-2, etc.)
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string; // Short description for hover
  fullDescription: string; // Long description for detail page
  year: string;
  role: string;
  client: string;
  thumbnail: string;
  aspectRatio: string; // Tailwind class, e.g., 'aspect-square', 'aspect-video', 'aspect-[3/4]'
  gallery: ProjectMedia[];
}