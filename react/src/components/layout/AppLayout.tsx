import { useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationStack from "./NotificationStack";
import SettingsPanel from "./SettingsPanel";

const AppLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { notifications, dismiss, clearAll } = useNotifications(isAuthenticated);

  const displayName =
    user && [user.first_name, user.last_name].filter(Boolean).join(" ").trim();

  return (
    <div className="app-shell">
      <header className="app-navbar">
        <div className="app-brand">
          <span className="app-brand-badge" />
          <span className="app-brand-name">Control Center</span>
        </div>
        <div className="app-nav-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => setIsSettingsOpen(true)}
          >
            {displayName || user?.email || "Settings"}
          </button>
          <button type="button" onClick={logout}>
            Sign out
          </button>
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
