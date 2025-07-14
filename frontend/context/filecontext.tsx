import { createContext, useContext, useState, ReactNode } from "react";

type FileContextType = {
  file: File | null;
  setFile: (file: File | null) => void;
};

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <FileContext.Provider value={{ file, setFile }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFile() {
  const context = useContext(FileContext);
  if (!context) throw new Error("useFile must be used within FileProvider");
  return context;
}
