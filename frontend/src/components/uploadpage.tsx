import { useState } from "react";
import { motion } from "framer-motion";
import { useFile } from "../../context/filecontext";

type UploadPageProps = {
  navigateToIDE: () => void;
};

export default function UploadPage({ navigateToIDE }: UploadPageProps) {
  const { file, setFile } = useFile();
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = (f: File) => {
    if (f && f.name.endsWith(".md")) {
      console.log(f.name);
      setFile(f);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFileUpload(f);
  };

  const handleDownload = () => {
    // Download a file from your directory
    const a = document.createElement('a');
    a.href = '../../../problems/0_template.md'; // Replace with your file path
    a.download = 'default.md'; // Optional: specify download filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Upload your lesson plan</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Upload your markdown file and let our software create a personalized learning experience and AI tailored to your content.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upload Area */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className={`relative border-2 border-dashed rounded-3xl px-12 py-6 text-center transition-all duration-300 ${
              dragOver
                ? "border-green-400 bg-green-50/50 scale-[1.02]"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
            }`}
            onDragOver={(e) => { 
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {/* Upload Icon */}
            <div className="mb-8">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${ dragOver ? "bg-green-100" : "bg-gray-100" }`}>
                <svg className={`w-10 h-10 transition-colors duration-300 ${ dragOver ? "text-green-600" : "text-gray-400" }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={`text-2xl font-semibold transition-colors duration-300 ${ dragOver ? "text-green-600" : "text-gray-900" }`}
              >
                {dragOver ? "Drop your file here" : "Upload your document"}
              </h3>
              <p className="text-gray-500 text-lg">Drag and drop your .md file or click to browse</p>
            </div>

            <input type="file" accept=".md" className="hidden" id="file-upload" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.name.endsWith(".md")) {
                  handleFileUpload(f);
                }
              }}
            />
            <label htmlFor="file-upload" className="mt-8 cursor-pointer inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Choose File
            </label>

            {file?.name && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-green-800 font-medium">File uploaded successfully</p>
                    <p className="text-green-600 text-sm">{file.name}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100" >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Supported Files</h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Markdown (.md) files
              </li>
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">How it Works</h3>
            </div>
            <div className="space-y-3">
              {["Upload markdown file", "Analyze requirements", "Generate lesson with AI peer", "Start learning"].map((step, index) => (
                <div className="flex gap-3" key={index}>
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-medium mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-600 text-sm">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
        <button onClick={handleDownload} className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform"  fill="none"  stroke="currentColor"  viewBox="0 0 24 24">
            <path strokeLinecap="round"  strokeLinejoin="round"  strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download Template File
        </button>
        <button onClick={navigateToIDE}
          className="group bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Enter IDE
        </button>
      </motion.div>
    </div>
  );
}
