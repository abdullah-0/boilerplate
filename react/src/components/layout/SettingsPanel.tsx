import { FormEvent, useEffect, useMemo, useState } from "react";

import { useUpdateProfileMutation } from "@/api/user/userApi";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/error";

type SettingsPanelProps = {
  onClose: () => void;
};

const SettingsPanel = ({ onClose }: SettingsPanelProps) => {
  const { user, refetchProfile } = useAuth();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
  });

  useEffect(() => {
    if (!user) {
      return;
    }
    setForm({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
    });
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!user) {
      return;
    }

    try {
      const payload = {
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || null,
      };
      await updateProfile(payload).unwrap();
      await refetchProfile();
      setStatus({ type: "success", message: "Profile details updated." });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "Unable to update profile right now."),
      });
    }
  };

  const displayEmail = useMemo(() => user?.email ?? "", [user]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="modal-panel"
        role="document"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2>Account settings</h2>
            <p>Manage how your profile appears across the workspace.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close settings"
          >
            x
          </button>
        </header>
        <section className="modal-content">
          <div className="surface muted">
            <span>Email</span>
            <strong>{displayEmail}</strong>
          </div>
          <form className="modal-form" onSubmit={handleSubmit}>
            <label>
              First name
              <input
                name="first_name"
                value={form.first_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, first_name: event.target.value }))
                }
                required
                autoComplete="given-name"
              />
            </label>
            <label>
              Last name
              <input
                name="last_name"
                value={form.last_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, last_name: event.target.value }))
                }
                autoComplete="family-name"
              />
            </label>
            {status ? (
              <p className={status.type === "success" ? "form-success" : "form-error"}>
                {status.message}
              </p>
            ) : null}
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={onClose}>
                Close
              </button>
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default SettingsPanel;
