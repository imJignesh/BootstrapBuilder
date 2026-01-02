
import React from 'react';

interface ComponentPreviewProps {
  html: string;
  css: string;
}

const ComponentPreview: React.FC<ComponentPreviewProps> = ({ html, css }) => {
  const srcDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body { 
          padding: 20px; 
          background: #ffffff; 
          min-height: 100vh;
        }
        ${css}
      </style>
    </head>
    <body>
      ${html}
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
  `;

  return (
    <div className="w-full h-full overflow-hidden bg-white">
      <iframe
        title="preview"
        srcDoc={srcDoc}
        className="w-full h-full border-none"
        sandbox="allow-scripts"
      />
    </div>
  );
};

export default ComponentPreview;
