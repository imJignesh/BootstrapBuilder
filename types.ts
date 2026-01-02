
export type StyleOption = 
  | "Corporate" | "Creative" | "Modern" | "Minimal" | "Flat" | "Material" 
  | "Brutalist" | "Neumorphic" | "Skeuomorphic" | "Retro" | "Vintage" 
  | "Futuristic" | "Industrial" | "Editorial" | "Portfolio" | "Experimental" 
  | "Luxury" | "Playful" | "Dark Mode" | "Glassmorphism" | "Swiss / International" 
  | "Monochrome" | "Bold Typography" | "Illustration-Led" | "Data-Driven" 
  | "Product-First" | "Startup" | "Enterprise" | "Agency" | "E-commerce" 
  | "Landing Page" | "Dashboard" | "Magazine" | "Tech / SaaS";

export interface ComponentVariation {
  themeName: string;
  html: string;
  css: string;
  description: string;
}

export interface GeneratedComponent {
  id: string;
  name: string;
  style: StyleOption;
  timestamp: number;
  image: string; // base64
  variations: ComponentVariation[];
  guide: string;
  structureGuide: string;
  content: string;
}

export interface AIPipelineResponse {
  themes: { name: string; description: string }[];
  guide: string;
  content: string;
  variations: {
    themeName: string;
    html: string;
    css: string;
  }[];
}
