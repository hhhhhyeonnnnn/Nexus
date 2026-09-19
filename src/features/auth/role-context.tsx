"use client";

import { readBrandStorage } from "@/lib/utils/brand-storage";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  getUserRoleContextAction,
  type UserRoleType,
  type CurrentUserOrganization,
} from "@/features/projects/actions";

interface RoleContextValue {
  userId: string | null;
  organizationId: string | null;
  actualRole: UserRoleType;
  activeRole: UserRoleType;
  setActiveRole: (role: UserRoleType) => void;
  departmentName: string | null;
  jobTitle: string | null;
  orgName: string;
  isPrivileged: boolean;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  userId: null,
  organizationId: null,
  actualRole: "EXECUTIVE",
  activeRole: "EXECUTIVE",
  setActiveRole: () => {},
  departmentName: null,
  jobTitle: null,
  orgName: "학생회",
  isPrivileged: true,
  isLoading: false,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [membership, setMembership] = useState<CurrentUserOrganization | null>(null);
  const [activeRole, setActiveRoleState] = useState<UserRoleType>("EXECUTIVE");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getUserRoleContextAction().then((data) => {
      if (!mounted) return;
      if (data) {
        setMembership(data);
        const saved = typeof window !== "undefined" ? readBrandStorage("preview_role") : null;
        if (saved && (saved === "EXECUTIVE" || saved === "HEAD" || saved === "MEMBER")) {
          setActiveRoleState(saved as UserRoleType);
        } else {
          setActiveRoleState(data.userRoleType);
        }
      }
      setIsLoading(false);
    });

    const handleRoleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<UserRoleType>;
      if (customEvent.detail) {
        setActiveRoleState(customEvent.detail);
      }
    };

    window.addEventListener("all-in-role-change", handleRoleEvent);
    return () => {
      mounted = false;
      window.removeEventListener("all-in-role-change", handleRoleEvent);
    };
  }, []);

  const setActiveRole = (role: UserRoleType) => {
    setActiveRoleState(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("all-in_preview_role", role);
      window.dispatchEvent(new CustomEvent("all-in-role-change", { detail: role }));
    }
  };

  const actualRole = membership?.userRoleType ?? "EXECUTIVE";
  const isPrivileged = actualRole === "EXECUTIVE" || actualRole === "HEAD";

  return (
    <RoleContext.Provider
      value={{
        userId: membership?.userId ?? null,
        organizationId: membership?.organizationId ?? null,
        actualRole,
        activeRole,
        setActiveRole,
        departmentName: membership?.departmentName ?? null,
        jobTitle: membership?.jobTitle ?? null,
        orgName: membership?.organization.name ?? "학생회",
        isPrivileged,
        isLoading,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRoleContext() {
  return useContext(RoleContext);
}
