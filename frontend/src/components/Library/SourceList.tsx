import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Clock, Hash } from 'lucide-react';
import { useDocument } from '../../context/AppContext';

export function SourceList() {
  const { documents, activeDocumentId, setActiveDocument, removeDocument } = useDocument();

  const formatFileSize = (text: string) => {
    const charCount = text.length;
    if (charCount < 1000) return `${charCount} chars`;
    if (charCount < 1000000) return `${(charCount / 1000).toFixed(1)}K chars`;
    return `${(charCount / 1000000).toFixed(1)}M chars`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {documents.map((doc) => {
            const isActive = doc.id === activeDocumentId;
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className={`
                  group relative p-4 rounded-xl border transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-white border-sage-300 shadow-md' 
                    : 'bg-cream-50 border-bark-200 shadow-sm hover:shadow-md hover:bg-white'
                  }
                `}
                onClick={() => setActiveDocument(doc.id)}
              >
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDocument(doc.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-bark-100 transition-all z-10"
                  aria-label="Remove document"
                >
                  <X className="w-4 h-4 text-bark-500" />
                </button>

                {/* File info */}
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-sage-200' : 'bg-sage-100'
                  }`}>
                    <FileText className={`w-5 h-5 ${isActive ? 'text-sage-700' : 'text-sage-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium break-words pr-6 ${
                      isActive ? 'text-bark-900' : 'text-bark-800'
                    }`}>
                      {doc.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-bark-500">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {formatFileSize(doc.textContent)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(doc.uploadedAt)}
                      </span>
                    </div>
                  </div>
                </div>


                {/* Active indicator */}
                {isActive && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sage-400 animate-pulse" />
                    <span className="text-xs font-medium text-sage-600">
                      Active study material
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
}
