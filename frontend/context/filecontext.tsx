import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";

type SerializedFile = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content: string; // using base64
};

type FileContextType = {
  files: File[];
  setFiles: (files: File[]) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
};

const FileContext = createContext<FileContextType | undefined>(undefined);

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Encoding for saving to sessionStorage
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Convert base64 back to File
const base64ToFile = (serializedFile: SerializedFile): File => {
  // Remove data URL prefix (e.g., "data:text/plain;base64,")
  const base64Data = serializedFile.content.split(',')[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], serializedFile.name, {
    type: serializedFile.type,
    lastModified: serializedFile.lastModified
  });
};

// Serialize files to sessionStorage
const serializeFiles = async (files: File[]): Promise<void> => {
  try {
    const serializedFiles: SerializedFile[] = [];
    
    for (const file of files) {
      const content = await fileToBase64(file);
      serializedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        content
      });
    }
    
    sessionStorage.setItem('persistedFiles', JSON.stringify(serializedFiles));
  } catch (error) {
    console.error('Error serializing files:', error);
  }
};

// Deserialize files from sessionStorage
const deserializeFiles = (): File[] => {
  try {
    const serializedData = sessionStorage.getItem('persistedFiles');
    if (!serializedData) return [];
    
    const serializedFiles: SerializedFile[] = JSON.parse(serializedData);
    return serializedFiles.map(base64ToFile);
  } catch (error) {
    console.error('Error deserializing files:', error);
    return [];
  }
};
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

export default function FileProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const location = useLocation();

  const shouldResetOnLanding = import.meta.env.DEV;

  // Load files from sessionStorage on mount
  useEffect(() => {
    // Clear any persisted uploads when we hit the landing page so a refresh starts clean during dev.
    if (shouldResetOnLanding && location.pathname === "/") {
      sessionStorage.removeItem('persistedFiles');
      sessionStorage.removeItem('selectedFileIndex');
      setFiles([]);
      setSelectedFile(null);
      return;
    }

    const restoredFiles = deserializeFiles();
    if (restoredFiles.length > 0) {
      setFiles(restoredFiles);

      // Restore selected file
      const selectedIndex = sessionStorage.getItem('selectedFileIndex');
      if (selectedIndex && parseInt(selectedIndex) < restoredFiles.length) {
        setSelectedFile(restoredFiles[parseInt(selectedIndex)]);
      }
    }
  }, [location.pathname, shouldResetOnLanding]);

  // used for sessionStorage for setFiles
  const persistentSetFiles = async (newFiles: File[]) => {
    setFiles(newFiles);
    await serializeFiles(newFiles);
  };

  // used for sessionStorage for setSelectedFile
  const persistentSetSelectedFile = (file: File | null) => {
    setSelectedFile(file);
    
    if (file) { const index = files.findIndex(f => f.name === file.name && f.lastModified === file.lastModified && f.size === file.size);
      sessionStorage.setItem('selectedFileIndex', index.toString());
    } else {
      sessionStorage.removeItem('selectedFileIndex');
    }
  };

  return (
    <FileContext.Provider value={{ files,  setFiles: persistentSetFiles,  selectedFile,  setSelectedFile: persistentSetSelectedFile }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FileContext);
  if (!context) throw new Error("useFiles must be used within FileProvider");
  return context;
}
