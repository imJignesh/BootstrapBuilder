
import React, { useState, useEffect, useRef } from 'react';
import { StyleOption, GeneratedComponent } from './types';
import { STYLE_OPTIONS, Icons } from './constants';
import { processPipeline } from './services/gemini';
import ComponentPreview from './components/ComponentPreview';
import CodeEditor from './components/CodeEditor';

const App: React.FC = () => {
  const [history, setHistory] = useState<GeneratedComponent[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>("Modern");
  const [isGenerating, setIsGenerating] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [activeComponent, setActiveComponent] = useState<GeneratedComponent | null>(null);
  const [activeVariationIdx, setActiveVariationIdx] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [workspaceMode, setWorkspaceMode] = useState<'preview' | 'code'>('preview');
  const [componentName, setComponentName] = useState("");
  const [structureGuide, setStructureGuide] = useState("");
  const [userContent, setUserContent] = useState("");
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('vision_bootstrap_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generationSteps]);

  // Timer effect
  useEffect(() => {
    let interval: number;
    if (isGenerating) {
      setElapsedTime(0);
      interval = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const saveHistory = (newHistory: GeneratedComponent[]) => {
    setHistory(newHistory);
    localStorage.setItem('vision_bootstrap_history', JSON.stringify(newHistory));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addLog = (msg: string) => {
    setGenerationSteps(prev => [...prev, `> ${msg}`]);
  };

  const runPipeline = async () => {
    setIsGenerating(true);
    setGenerationSteps([]);
    
    const logs = [
      "SYSTEM: Initializing design pipeline...",
      "VISION: Parsing image constraints...",
      "ASSETS: Contacting Freepik Global...",
      "CONTENT: Injecting user specifications...",
      "STYLE: Mapping aesthetic vectors...",
      "COMPILE: Synthesizing V1 - V2...",
      "COMPILE: Synthesizing V3 - V4...",
      "FINALIZE: Optimizing micro-interactions..."
    ];

    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < logs.length) {
        addLog(logs[logIdx]);
        logIdx++;
      }
    }, 600);

    try {
      const result = await processPipeline(image, selectedStyle, structureGuide, userContent);
      clearInterval(logInterval);
      
      if (!result || !result.variations || result.variations.length === 0) {
        throw new Error("Invalid response: No variations generated.");
      }

      addLog(`SUCCESS: 4 Versions Compiled in ${elapsedTime}s.`);

      const newComp: GeneratedComponent = {
        id: crypto.randomUUID(),
        name: componentName || `${selectedStyle} Project`,
        style: selectedStyle,
        timestamp: Date.now(),
        image: image || "",
        variations: result.variations.map(v => ({
          ...v,
          description: result.themes?.find(t => t.name === v.themeName)?.description || "Aesthetic variation based on synthesis logic."
        })),
        guide: result.guide || "",
        structureGuide: structureGuide,
        content: result.content || ""
      };
      
      setTimeout(() => {
        setActiveComponent(newComp);
        setActiveVariationIdx(0);
        setWorkspaceMode('preview');
        saveHistory([newComp, ...history]);
        setIsGenerating(false);
      }, 500);

    } catch (error) {
      clearInterval(logInterval);
      console.error(error);
      alert("Error: Synthesis failed. The model might be busy or the request timed out.");
      setIsGenerating(false);
    }
  };

  const downloadHtml = () => {
    if (!activeComponent || !activeComponent.variations[activeVariationIdx]) return;
    const current = activeComponent.variations[activeVariationIdx];
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${activeComponent.name} - ${current.themeName}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { padding: 40px 0; background: #ffffff; min-height: 100vh; }
        ${current.css}
    </style>
</head>
<body>
    <div class="container">
        ${current.html}
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeComponent.name.replace(/\s+/g, '-').toLowerCase()}-v${activeVariationIdx + 1}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const deleteComponent = (id: string) => {
    const updated = history.filter(c => c.id !== id);
    saveHistory(updated);
    if (activeComponent?.id === id) setActiveComponent(null);
  };

  const activeVariation = activeComponent?.variations?.[activeVariationIdx];

  return (
    <div className="flex h-screen bg-[#030712] text-gray-200 overflow-hidden font-['Inter']">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-800 bg-black flex flex-col z-30 shadow-2xl shrink-0">
        <div className="p-8 border-b border-gray-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Icons.Code />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">VBS.AI</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Synthesis Engine</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {history.map((comp) => (
            <div 
              key={comp.id}
              onClick={() => { setActiveComponent(comp); setActiveVariationIdx(0); setWorkspaceMode('preview'); }}
              className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                activeComponent?.id === comp.id 
                ? 'bg-blue-600/10 border-blue-500/50 shadow-inner' 
                : 'bg-white/5 border-transparent hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 flex-shrink-0">
                  {comp.image ? <img src={comp.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-700 text-[10px] font-bold">RAW</div>}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[11px] font-black truncate text-white uppercase tracking-tight">{comp.name}</h3>
                  <p className="text-[9px] text-gray-600 font-mono uppercase italic">{comp.style}</p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteComponent(comp.id); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all bg-black/40 rounded-lg backdrop-blur"
              >
                <Icons.Trash />
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-800">
          <button 
            onClick={() => { setActiveComponent(null); setImage(null); setComponentName(""); setStructureGuide(""); setUserContent(""); }}
            className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black hover:bg-gray-200 rounded-2xl transition-all text-xs font-black uppercase tracking-widest shadow-xl active:scale-95"
          >
            <Icons.Plus /> New Project
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-gray-800 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-10 z-20 shrink-0">
          <div className="flex items-center gap-4">
            {activeComponent && (
              <button 
                onClick={() => setActiveComponent(null)}
                className="flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl border border-gray-800 text-white transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </button>
            )}
            <div>
              <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">
                {activeComponent ? activeComponent.name : "Synthesis Config"}
              </h2>
              {activeComponent && <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Version {activeVariationIdx + 1}</p>}
            </div>
          </div>
          
          {activeComponent && (
            <div className="flex items-center gap-4">
              {/* Variations Selector */}
              <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-800">
                {activeComponent.variations.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveVariationIdx(idx)}
                    className={`w-9 h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeVariationIdx === idx ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                  >
                    V{idx + 1}
                  </button>
                ))}
              </div>

              {/* Display Mode */}
              <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-800 h-10">
                <button 
                  onClick={() => setWorkspaceMode('preview')}
                  className={`px-4 flex items-center justify-center text-[10px] font-black uppercase rounded-lg transition-all ${workspaceMode === 'preview' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >Preview</button>
                <button 
                  onClick={() => setWorkspaceMode('code')}
                  className={`px-4 flex items-center justify-center text-[10px] font-black uppercase rounded-lg transition-all ${workspaceMode === 'code' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >Source</button>
              </div>

              {/* Device Toggle */}
              <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-800 h-10">
                <button 
                  onClick={() => setPreviewDevice('desktop')}
                  className={`w-10 flex items-center justify-center rounded-lg transition-all ${previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
                ><Icons.Desktop /></button>
                <button 
                  onClick={() => setPreviewDevice('mobile')}
                  className={`w-10 flex items-center justify-center rounded-lg transition-all ${previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
                ><Icons.Smartphone /></button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => copyToClipboard(activeVariation?.html || "")}
                  className="px-4 h-10 bg-white/5 hover:bg-white/10 border border-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2"
                >
                  <Icons.Code /> HTML
                </button>
                <button 
                  onClick={() => copyToClipboard(activeVariation?.css || "")}
                  className="px-4 h-10 bg-white/5 hover:bg-white/10 border border-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2"
                >
                  <Icons.Code /> CSS
                </button>
                <button 
                  onClick={downloadHtml}
                  className="px-4 h-10 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <Icons.Download /> Export
                </button>
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#030712]">
          {!activeComponent && !isGenerating && (
            <div className="p-12 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white/5 border border-gray-800 rounded-[32px] p-8 space-y-6 backdrop-blur-xl">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">1. Reference Image</h3>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative w-full aspect-square border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${
                        image ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {image ? (
                        <div className="w-full h-full p-4"><img src={image} className="w-full h-full object-contain rounded-2xl" /></div>
                      ) : (
                        <div className="flex flex-col items-center"><Icons.Plus /><p className="text-[10px] font-black text-gray-500 uppercase mt-2">Mockup</p></div>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                    </div>
                    <input 
                      type="text"
                      value={componentName}
                      onChange={(e) => setComponentName(e.target.value)}
                      placeholder="Project Name..."
                      className="w-full bg-black/50 border border-gray-800 rounded-2xl px-5 py-4 text-[10px] font-bold uppercase focus:outline-none focus:border-blue-500/50 text-white placeholder:text-gray-800"
                    />
                  </div>

                  <div className="bg-white/5 border border-gray-800 rounded-[32px] p-8 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Aesthetic Style</h3>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_OPTIONS.map((style) => (
                        <button
                          key={style}
                          onClick={() => setSelectedStyle(style)}
                          className={`px-3 py-2 rounded-lg text-[9px] font-bold border transition-all ${
                            selectedStyle === style 
                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                            : 'bg-black/40 border-gray-800 text-gray-500'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 flex flex-col gap-8">
                  <div className="bg-white/5 border border-gray-800 rounded-[32px] p-10 space-y-8 backdrop-blur-xl flex-1 flex flex-col">
                    <div className="flex-1 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[9px]">2</span> Structure</h3>
                      <textarea 
                        value={structureGuide}
                        onChange={(e) => setStructureGuide(e.target.value)}
                        placeholder="Define spatial logic (e.g. 3-column feature grid)..."
                        className="w-full bg-black/40 border border-gray-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500/50 h-[120px] resize-none text-gray-300 placeholder:text-gray-800"
                      />
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[9px]">3</span> Content</h3>
                      <textarea 
                        value={userContent}
                        onChange={(e) => setUserContent(e.target.value)}
                        placeholder="Component copy and data..."
                        className="w-full bg-black/40 border border-gray-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-500/50 h-[120px] resize-none text-gray-300 placeholder:text-gray-800"
                      />
                    </div>
                  </div>

                  <button 
                    disabled={isGenerating}
                    onClick={runPipeline}
                    className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-[32px] hover:scale-[1.01] transition-all disabled:opacity-30 flex items-center justify-center gap-4 text-sm uppercase tracking-widest"
                  >
                    <span>Begin Synthesis</span>
                    <Icons.Code />
                  </button>
                </div>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto py-20">
              <div className="relative mb-12">
                 <div className="w-24 h-24 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center text-blue-500"><Icons.Code /></div>
              </div>
              
              <div className="mb-8 text-center">
                <p className="text-blue-500 font-black text-3xl mb-2 font-mono">{elapsedTime}s</p>
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Time Elapsed</p>
              </div>

              <div className="w-full bg-black/95 border border-blue-500/20 rounded-[40px] p-12 font-mono text-[11px] leading-relaxed shadow-2xl min-h-[300px]">
                {generationSteps.map((step, i) => (
                  <div key={i} className="text-blue-400/80 mb-1">
                    <span className="text-blue-900 mr-3">[{new Date().toLocaleTimeString([], { hour12: false, second: '2-digit' })}]</span>
                    {step}
                  </div>
                ))}
                <div className="h-4 w-2 bg-blue-500 animate-pulse inline-block ml-2"></div>
              </div>
              
              <p className="mt-8 text-gray-600 text-[10px] font-bold uppercase tracking-widest">Aesthetic variations are being calculated via LLM...</p>
            </div>
          )}

          {activeComponent && !isGenerating && (
            <div className="h-full flex flex-col p-8 animate-in fade-in duration-700">
                <div className={`mx-auto h-full max-h-[85vh] rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-700 ease-out border border-gray-800/50 ${workspaceMode === 'preview' && previewDevice === 'mobile' ? 'w-[375px]' : 'w-full'}`}>
                  {activeVariation ? (
                    workspaceMode === 'preview' ? (
                      <ComponentPreview html={activeVariation.html} css={activeVariation.css} />
                    ) : (
                      <CodeEditor code={`<!-- ${activeComponent.name} - V${activeVariationIdx + 1} -->\n${activeVariation.html}\n\n/* STYLE */\n${activeVariation.css}`} />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-black/20 font-black uppercase text-[10px]">Synthesis Void</div>
                  )}
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
