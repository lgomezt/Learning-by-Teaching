import { createContext, useContext, useState, ReactNode } from "react";

type FileContextType = {
  files: File[];
  setFiles: (files: File[]) => void;

  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
};

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <FileContext.Provider value={{ files, setFiles, selectedFile, setSelectedFile }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FileContext);
  if (!context) throw new Error("useFiles must be used within FileProvider");
  return context;
}
