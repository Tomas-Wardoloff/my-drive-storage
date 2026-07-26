"use client";

import { ReactNode } from "react";
import { AccountProvider, useAccountContext } from "./AccountContext";
import { FolderProvider, useFolderContext, FolderItem } from "./FolderContext";
import { FilesProvider, useFilesContext } from "./FilesContext";

export type { FolderItem };

export function DashboardProvider({ children }: { children: ReactNode }) {
  return (
    <AccountProvider>
      <FolderProvider>
        <FilesProvider>{children}</FilesProvider>
      </FolderProvider>
    </AccountProvider>
  );
}

export function useDashboard() {
  const accountContext = useAccountContext();
  const folderContext = useFolderContext();
  const filesContext = useFilesContext();

  return {
    ...accountContext,
    ...folderContext,
    ...filesContext,
  };
}

export { useAccountContext, useFolderContext, useFilesContext };
