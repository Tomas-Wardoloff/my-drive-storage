"use client";

import { createContext, useContext, useState, useMemo, useEffect, ReactNode } from "react";
import { useAccountContext } from "./AccountContext";

export interface FolderItem {
  id: string;
  name: string;
}

interface FolderContextType {
  folderStack: FolderItem[];
  currentFolder: FolderItem;
  navigateToFolder: (folder: FolderItem) => void;
  navigateToBreadcrumb: (index: number) => void;
  resetFolderStack: () => void;
}

const DEFAULT_ROOT_FOLDER: FolderItem = { id: "root", name: "My Drive" };

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export function FolderProvider({ children }: { children: ReactNode }) {
  const { activeAccountId } = useAccountContext();
  const [folderStack, setFolderStack] = useState<FolderItem[]>([DEFAULT_ROOT_FOLDER]);

  // Reset folder stack to root whenever activeAccountId changes
  useEffect(() => {
    setFolderStack([DEFAULT_ROOT_FOLDER]);
  }, [activeAccountId]);

  const currentFolder = useMemo(() => {
    return folderStack[folderStack.length - 1] || DEFAULT_ROOT_FOLDER;
  }, [folderStack]);

  function navigateToFolder(folder: FolderItem) {
    setFolderStack((prev) => [...prev, folder]);
  }

  function navigateToBreadcrumb(index: number) {
    setFolderStack((prev) => prev.slice(0, index + 1));
  }

  function resetFolderStack() {
    setFolderStack([DEFAULT_ROOT_FOLDER]);
  }

  return (
    <FolderContext.Provider
      value={{
        folderStack,
        currentFolder,
        navigateToFolder,
        navigateToBreadcrumb,
        resetFolderStack,
      }}
    >
      {children}
    </FolderContext.Provider>
  );
}

export function useFolderContext() {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error("useFolderContext must be used within a FolderProvider");
  }
  return context;
}
