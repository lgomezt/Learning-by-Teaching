import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, AlertCircle, Check, FileText } from 'lucide-react';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { useDocument } from '../../context/AppContext';

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { processFile, isProcessing, error } = useFileProcessor();
  const { addDocument, documents } = useDocument();

  const handleFile = useCallback(async (file: File) => {
    try {
      setUploadSuccess(false);
      console.log('Starting file processing for:', file.name, 'Type:', file.type);
      
      const result = await processFile(file);
      
      console.log('File processing completed. Text length:', result.text.length);
      
      // Add document to the list (creates new conversation thread)
      addDocument({
        name: file.name,
        type: file.type || 'text/plain',
        textContent: result.text,
        uploadedAt: new Date(),
      });
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (err) {
      // Error is handled by the hook, but ensure we log it
      console.error('File processing error in FileUploader:', err);
      // The error state from useFileProcessor should be displayed
    }
  }, [processFile, addDocument]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <motion.label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? 'var(--color-sage-400)' : 'var(--color-bark-300)',
        }}
        className={`
          relative flex flex-col items-center justify-center
          p-6 rounded-xl border-2 border-dashed cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'bg-sage-50 border-sage-400' : 'bg-cream-50 border-bark-300 hover:border-sage-400 hover:bg-sage-50/30'}
          ${isProcessing ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleInputChange}
          className="sr-only"
          disabled={isProcessing}
        />
        
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <Loader2 className="w-10 h-10 text-sage-500 animate-spin" />
              <p className="mt-3 text-sm text-bark-600">Processing document...</p>
            </motion.div>
          ) : uploadSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-sage-600" />
              </div>
              <p className="mt-3 text-sm text-sage-700 font-medium">Document ready!</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              {documents.length === 0 ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-bark-100 flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-bark-400" />
                  </div>
                  <p className="text-base font-medium text-bark-700 mb-1">
                    No documents loaded
                  </p>
                  <p className="text-sm text-bark-500">
                    Drop a file or click to upload
                  </p>
                  <p className="mt-1 text-xs text-bark-400">
                    PDF, TXT, or Markdown
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-bark-100 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-bark-500" />
                  </div>
                  <p className="text-sm font-medium text-bark-700">
                    Drop a file or click to upload
                  </p>
                  <p className="mt-1 text-xs text-bark-500">
                    PDF, TXT, or Markdown
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.label>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
          >
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
