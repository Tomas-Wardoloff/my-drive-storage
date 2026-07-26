"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { DriveFile } from "@/types/dashboard";
import { useAccountContext } from "./AccountContext";
import { useFolderContext } from "./FolderContext";

interface FilesContextType {
  files: DriveFile[];
  starredFiles: DriveFile[];
  loadingFiles: boolean;
  loadingStarredFiles: boolean;
  searchQuery: string;
  error: string | null;
  setSearchQuery: (query: string) => void;
  setError: (err: string | null) => void;
  loadActiveAccountFiles: (accountId: string, folderId?: string) => Promise<void>;
  loadActiveAccountStarredFiles: (accountId: string) => Promise<void>;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export function FilesProvider({ children }: { children: ReactNode }) {
  const { activeAccountId, refreshAccountsSilently } = useAccountContext();
  const { currentFolder } = useFolderContext();

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [starredFiles, setStarredFiles] = useState<DriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingStarredFiles, setLoadingStarredFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Read error parameter from URL if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) setError(`Authentication error: ${err}`);
    }
  }, []);

  // Fetch files for current active account and specified folder
  async function loadActiveAccountFiles(accountId: string, folderId: string = "root") {
    try {
      setLoadingFiles(true);
      setError(null);
      const res = await fetch(`/api/accounts/${accountId}/files?folderId=${folderId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error fetching Google Drive files");
      }
      const data = await res.json();
      setFiles(data.files ?? []);
      refreshAccountsSilently();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error loading files");
    } finally {
      setLoadingFiles(false);
    }
  }

  // Fetch ALL starred files for the active account (independent of current folder)
  async function loadActiveAccountStarredFiles(accountId: string) {
    try {
      setLoadingStarredFiles(true);
      const res = await fetch(`/api/accounts/${accountId}/files?starred=true`);
      if (res.ok) {
        const data = await res.json();
        setStarredFiles(data.files ?? []);
      }
    } catch (err) {
      console.error("Error loading starred files:", err);
    } finally {
      setLoadingStarredFiles(false);
    }
  }

  // Load starred files when activeAccountId changes
  useEffect(() => {
    if (activeAccountId) {
      loadActiveAccountStarredFiles(activeAccountId);
    } else {
      setStarredFiles([]);
    }
  }, [activeAccountId]);

  // Reload folder files when activeAccountId or currentFolder changes
  useEffect(() => {
    if (activeAccountId) {
      loadActiveAccountFiles(activeAccountId, currentFolder.id);
    } else {
      setFiles([]);
    }
  }, [activeAccountId, currentFolder.id]);

  return (
    <FilesContext.Provider
      value={{
        files,
        starredFiles,
        loadingFiles,
        loadingStarredFiles,
        searchQuery,
        error,
        setSearchQuery,
        setError,
        loadActiveAccountFiles,
        loadActiveAccountStarredFiles,
      }}
    >
      {children}
    </FilesContext.Provider>
  );
}

export function useFilesContext() {
  const context = useContext(FilesContext);
  if (!context) {
    throw new Error("useFilesContext must be used within a FilesProvider");
  }
  return context;
}
