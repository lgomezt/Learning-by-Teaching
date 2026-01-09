import { useState, useCallback } from 'react';
import { uploadFile } from '../lib/api';

interface ProcessingResult {
  text: string;
  pageCount?: number;
}

interface UseFileProcessorReturn {
  processFile: (file: File) => Promise<ProcessingResult>;
  isProcessing: boolean;
  error: string | null;
}

export function useFileProcessor(): UseFileProcessorReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File): Promise<ProcessingResult> => {
    // Reset state before starting
    setIsProcessing(true);
    setError(null);

    // Use a timeout as a safety net to ensure isProcessing is always reset
    // 5 minutes should be enough for most documents (backend handles large files)
    const safetyTimeout = setTimeout(() => {
      console.warn('File processing safety timeout triggered - resetting state');
      setIsProcessing(false);
    }, 300000); // 5 minutes absolute maximum

    try {
      // Validate file type
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !['pdf', 'txt', 'md', 'markdown'].includes(extension)) {
        throw new Error(`Unsupported file type: ${extension}. Supported: PDF, TXT, MD`);
      }

      console.log('Uploading file to backend for processing:', file.name);
      
      // Send file to backend for processing (uses Google Gemini for PDFs)
      const result = await uploadFile(file);
      
      console.log('File processing completed. Text length:', result.text.length);
      
      // Ensure we have text content
      if (!result.text || result.text.trim().length === 0) {
        throw new Error('The file appears to be empty or contains no extractable text.');
      }
      
      clearTimeout(safetyTimeout);
      return {
        text: result.text,
        // pageCount not available from backend API, but that's okay
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process file';
      setError(message);
      console.error('File processing error:', err);
      clearTimeout(safetyTimeout);
      throw err;
    } finally {
      // Always reset processing state, even if there was an error
      clearTimeout(safetyTimeout);
      setIsProcessing(false);
    }
  }, []);

  return {
    processFile,
    isProcessing,
    error,
  };
}
