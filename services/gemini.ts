
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { StyleOption, AIPipelineResponse } from "../types";

// Always use process.env.API_KEY directly when initializing the GoogleGenAI client instance.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FREEPIK_API_KEY = 'FPSX77151724608d7fbb61a54340dc1bcf7a';

async function searchFreepikImages(query: string): Promise<string[]> {
  try {
    const targetUrl = `https://api.freepik.com/v1/resources?term=${encodeURIComponent(query)}&order=relevance&limit=15`;
    const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxiedUrl, {
      method: 'GET',
      headers: {
        'x-freepik-api-key': FREEPIK_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error("Freepik API Error");

    const data = await response.json();
    if (data && data.data) {
      return data.data
        .map((item: any) => item.image?.source?.url || item.image?.url)
        .filter(Boolean);
    }
    return [];
  } catch (error) {
    return [
      `https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200`,
      `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200`,
      `https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200`
    ];
  }
}

const getImagesTool: FunctionDeclaration = {
  name: 'get_freepik_images',
  parameters: {
    type: Type.OBJECT,
    description: 'Search for professional stock images.',
    properties: {
      query: { type: Type.STRING },
    },
    required: ['query'],
  },
};

export async function processPipeline(
  imageBase64: string | null, 
  style: StyleOption, 
  structureGuide: string,
  userContent: string
): Promise<AIPipelineResponse> {
  const contents: any[] = [];
  const parts: any[] = [];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: imageBase64.split(',')[1] || imageBase64
      }
    });
  }

  const promptText = `Act as a world-class senior frontend architect and UI/UX designer.
  
  TASK: Create a UI component in "${style}" style.
  
  STRICT CONTENT REQUIREMENT: 
  - You MUST use the exact text and data provided in the "CONTENT SPECIFICATION" below. 
  - DO NOT use generic "Lorem Ipsum" or random placeholder text. 
  - If the user provided titles, prices, or descriptions, they MUST appear in all 4 variations.

  STRICT STRUCTURE REQUIREMENT:
  - Adhere to the "COMPONENT STRUCTURE GUIDE" for the layout logic.

  INPUTS:
  1. COMPONENT STRUCTURE GUIDE: "${structureGuide || "Modern responsive layout."}"
  2. CONTENT SPECIFICATION: "${userContent || "Professional copy relevant to the design."}"
  3. DESIGN STYLE: "${style}"

  CRITICAL: Generate EXACTLY 4 distinct variations (V1 to V4). Every variation MUST be ultra-modern, professional, and visually stunning while keeping the EXACT SAME content provided by the user.
  
  DESIGN FIDELITY REQUIREMENTS:
  1. MICRO-INTERACTIONS: Every interactive element must have smooth transitions (cubic-bezier).
  2. HOVER EFFECTS: Complex states (lift, layered shadows, scale, color shifts).
  3. DEPTH: Multi-layered soft shadows.
  4. LINE WORK: Semi-transparent borders (rgba) for a premium feel.
  5. ANIMATIONS: entry states (slide-up, reveal).
  6. MODERN FEATURES: Glassmorphism, gradients, clean overflow handling.

  VARIATION THEMES:
  V1: Standard Interpretation - Polished and balanced.
  V2: Modern/Offset - Creative spacing and asymmetric flow.
  V3: Minimalist - High whitespace and extreme legibility.
  V4: Dark/Elevated - Premium dark mode with glowing accents.

  TECHNICAL STACK:
  - Bootstrap 5.3.
  - Custom CSS must be scoped to the component.
  - Use real images from 'get_freepik_images'.

  Return JSON object with 'themes', 'guide', 'content', and an array of 4 'variations' (themeName, html, css).`;

  parts.push({ text: promptText });
  contents.push({ parts });

  let response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: contents,
    config: { 
      tools: [{ functionDeclarations: [getImagesTool] }],
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  if (response.functionCalls && response.functionCalls.length > 0) {
    const functionResponses = [];
    for (const fc of response.functionCalls) {
      if (fc.name === 'get_freepik_images') {
        const images = await searchFreepikImages(fc.args.query as string);
        functionResponses.push({ id: fc.id, name: fc.name, response: { images: images } });
      }
    }

    response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        ...contents,
        { role: 'model', parts: response.candidates[0].content.parts },
        { parts: functionResponses.map(fr => ({ functionResponse: fr })) }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } } } },
            guide: { type: Type.STRING },
            content: { type: Type.STRING },
            variations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  themeName: { type: Type.STRING },
                  html: { type: Type.STRING },
                  css: { type: Type.STRING }
                },
                required: ["themeName", "html", "css"]
              }
            }
          },
          required: ["themes", "guide", "content", "variations"]
        }
      }
    });
  } else {
    response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } } } },
            guide: { type: Type.STRING },
            content: { type: Type.STRING },
            variations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { themeName: { type: Type.STRING }, html: { type: Type.STRING }, css: { type: Type.STRING } } } }
          },
          required: ["themes", "guide", "content", "variations"]
        }
      }
    });
  }

  return JSON.parse(response.text);
}
