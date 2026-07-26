"use client";

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { Account } from "@/types/dashboard";
import DisconnectConfirmModal from "@/components/common/ConfirmModal";

interface AccountContextType {
  accounts: Account[];
  activeAccountId: string | null;
  activeAccount: Account | null;
  loadingAccounts: boolean;
  disconnectingId: string | null;
  accountToDisconnect: { id: string; email: string } | null;
  setActiveAccountId: (id: string) => void;
  loadAccounts: (forceSync?: boolean) => Promise<void>;
  handleDisconnectAccount: (id: string, email: string) => void;
  closeDisconnectModal: () => void;
  executeDisconnectAccount: () => Promise<void>;
  refreshAccountsSilently: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [accountToDisconnect, setAccountToDisconnect] = useState<{
    id: string;
    email: string;
  } | null>(null);

  // Fetch accounts from API
  async function loadAccounts(forceSync = false) {
    try {
      setLoadingAccounts(true);
      const res = await fetch(forceSync ? "/api/accounts?sync=true" : "/api/accounts");
      if (!res.ok) throw new Error("Error fetching accounts");
      const data = await res.json();
      const loadedAccounts: Account[] = data.accounts ?? [];
      setAccounts(loadedAccounts);

      if (loadedAccounts.length > 0) {
        setActiveAccountId((prev) => {
          const savedId =
            typeof window !== "undefined" ? localStorage.getItem("activeAccountId") : null;
          const targetId = prev || savedId;
          if (targetId && loadedAccounts.some((a) => a.id === targetId)) {
            return targetId;
          }
          const firstActive = loadedAccounts.find((a) => a.tokenStatus === "ACTIVE");
          const selected = firstActive ? firstActive.id : loadedAccounts[0].id;
          if (typeof window !== "undefined") {
            localStorage.setItem("activeAccountId", selected);
          }
          return selected;
        });
      } else {
        setActiveAccountId(null);
      }
    } catch (err) {
      console.error("Unknown error loading accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function refreshAccountsSilently() {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts ?? []);
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const activeAccount = useMemo(() => {
    return accounts.find((a) => a.id === activeAccountId) ?? null;
  }, [accounts, activeAccountId]);

  const handleSelectActiveAccount = (id: string) => {
    setActiveAccountId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeAccountId", id);
    }
  };

  function handleDisconnectAccount(id: string, email: string) {
    setAccountToDisconnect({ id, email });
  }

  function closeDisconnectModal() {
    setAccountToDisconnect(null);
  }

  async function executeDisconnectAccount() {
    if (!accountToDisconnect) return;
    const { id } = accountToDisconnect;
    setDisconnectingId(id);

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error disconnecting account");

      const remaining = accounts.filter((a) => a.id !== id);
      setAccounts(remaining);

      if (activeAccountId === id) {
        const nextAccount =
          remaining.find((a) => a.tokenStatus === "ACTIVE") ?? remaining[0] ?? null;
        setActiveAccountId(nextAccount ? nextAccount.id : null);
      }
      setAccountToDisconnect(null);
    } catch (err) {
      console.error("Error disconnecting account:", err);
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <AccountContext.Provider
      value={{
        accounts,
        activeAccountId,
        activeAccount,
        loadingAccounts,
        disconnectingId,
        accountToDisconnect,
        setActiveAccountId: handleSelectActiveAccount,
        loadAccounts,
        handleDisconnectAccount,
        closeDisconnectModal,
        executeDisconnectAccount,
        refreshAccountsSilently,
      }}
    >
      {children}

      <DisconnectConfirmModal
        isOpen={accountToDisconnect !== null}
        accountEmail={accountToDisconnect?.email ?? null}
        isDisconnecting={disconnectingId !== null}
        onConfirm={executeDisconnectAccount}
        onClose={closeDisconnectModal}
      />
    </AccountContext.Provider>
  );
}

export function useAccountContext() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccountContext must be used within an AccountProvider");
  }
  return context;
}
