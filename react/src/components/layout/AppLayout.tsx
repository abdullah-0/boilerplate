import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationStack from "./NotificationStack";
import SettingsPanel from "./SettingsPanel";

const AppLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { notifications, dismiss, clearAll } = useNotifications(isAuthenticated);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const displayName =
    user && [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const primaryIdentifier = displayName || user?.email || "Account";
  const userInitials = useMemo(() => {
    if (displayName) {
      const initials = displayName
        .split(" ")
        .filter(Boolean)
        .map((segment) => segment.charAt(0)?.toUpperCase() ?? "")
        .join("");
      return initials.slice(0, 2) || user?.email?.charAt(0)?.toUpperCase() || "?";
    }

    return user?.email?.charAt(0)?.toUpperCase() || "?";
  }, [displayName, user?.email]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const handleOpenSettings = () => {
    setIsUserMenuOpen(false);
    setIsSettingsOpen(true);
  };

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    logout();
  };

  return (
    <div className="app-shell">
      <header className="app-navbar">
        <div className="app-navbar-left">
          <div className="app-navbar-brand">
            <span className="app-navbar-mark" aria-hidden="true">
              CC
            </span>
            <div className="app-navbar-brand-meta">
              <strong>Control Center</strong>
              <span>Operations dashboard</span>
            </div>
          </div>
          <nav className="app-navbar-menu" aria-label="Primary navigation">
            <span className="app-navbar-link is-active">Dashboard</span>
          </nav>
        </div>
        <div className="app-navbar-right" ref={userMenuRef}>
          <button
            type="button"
            className="app-navbar-user-toggle"
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            onClick={() => setIsUserMenuOpen((value) => !value)}
          >
            <span className="app-navbar-avatar" aria-hidden="true">
              {userInitials}
            </span>
            <span className="app-navbar-user-meta" aria-hidden="true">
              <span className="app-navbar-user-name">{primaryIdentifier}</span>
              {user?.email && displayName ? (
                <span className="app-navbar-user-email">{user.email}</span>
              ) : null}
            </span>
            <svg
              className="app-navbar-user-caret"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {isUserMenuOpen ? (
            <div className="app-navbar-user-menu" role="menu">
              <button
                type="button"
                className="app-navbar-user-menu-item"
                role="menuitem"
                onClick={handleOpenSettings}
              >
                Account settings
              </button>
              <button
                type="button"
                className="app-navbar-user-menu-item is-danger"
                role="menuitem"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
      <NotificationStack
        notifications={notifications}
        onDismiss={dismiss}
        onClearAll={clearAll}
      />
      {isSettingsOpen && user ? (
        <SettingsPanel onClose={() => setIsSettingsOpen(false)} />
      ) : null}
    </div>
  );
};

export default AppLayout;
