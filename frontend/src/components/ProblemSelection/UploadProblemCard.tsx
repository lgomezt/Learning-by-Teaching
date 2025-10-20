// UploadProblemCard.tsx

import React, { useState } from 'react';

// This component needs a function from its parent to tell it what to do when a file is uploaded.
interface UploadProblemCardProps {
  onFileUpload: (file: File) => void;
}

export const UploadProblemCard: React.FC<UploadProblemCardProps> = ({ onFileUpload }) => {
  const [dragOver, setDragOver] = useState(false);

  // It immediately calls the onFileUpload function passed in from the parent.
  const handleFileSelected = (file: File | undefined) => {
    if (file && file.name.endsWith('.md')) {
      onFileUpload(file);
    } else {
      // User feedback for wrong file type
      console.error("Please upload a valid .md file.");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelected(droppedFile);
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 h-full ${
        dragOver
          ? "border-green-400 bg-slate-700 scale-[1.02]"
          : "border-slate-600 bg-slate-800 hover:border-slate-500"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Hidden file input that we trigger with the label */}
      <input
        type="file"
        id="file-upload-card"
        className="hidden"
        accept=".md"
        onChange={(e) => handleFileSelected(e.target.files?.[0])}
      />

      {/* The visible content of the card */}
      <div className="mb-4">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${ dragOver ? "bg-green-500/20" : "bg-slate-700" }`}>
            <svg className={`w-8 h-8 transition-colors duration-300 ${ dragOver ? "text-green-400" : "text-slate-400" }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
        </div>
      </div>

      <h3 className={`text-lg font-medium transition-colors duration-300 ${ dragOver ? "text-green-400" : "text-white" }`}>
        Add New Problem
      </h3>
      <p className="text-slate-400 text-sm mt-1">Drag & drop or <label htmlFor="file-upload-card" className="text-green-400 font-semibold cursor-pointer hover:underline">browse</label> to upload a .md file.</p>
    </div>
  );
};