
import React, { useEffect, useRef } from 'react';

interface CodeEditorProps {
  code: string;
  language?: string;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language = 'html', readOnly = true }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const aceInstance = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current && (window as any).ace) {
      aceInstance.current = (window as any).ace.edit(editorRef.current);
      aceInstance.current.setTheme("ace/theme/monokai");
      aceInstance.current.session.setMode(`ace/mode/${language}`);
      aceInstance.current.setReadOnly(readOnly);
      aceInstance.current.setOptions({
        fontSize: "13px",
        showPrintMargin: false,
        showGutter: true,
        highlightActiveLine: true,
        wrap: true,
        useWorker: false,
        fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace"
      });
      aceInstance.current.setValue(code, -1);
    }

    return () => {
      if (aceInstance.current) {
        aceInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (aceInstance.current) {
      aceInstance.current.setValue(code, -1);
    }
  }, [code]);

  return (
    <div className="w-full h-full rounded-[24px] overflow-hidden border border-gray-800 shadow-2xl">
      <div ref={editorRef} className="w-full h-full" />
    </div>
  );
};

export default CodeEditor;
