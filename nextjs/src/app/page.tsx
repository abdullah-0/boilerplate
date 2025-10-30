"use client";

import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useNotifications } from "@/hooks/useNotifications";
import {
  createTeam,
  getTeams,
  inviteMember,
  updateMember,
  type Team,
  type TeamMember,
} from "@/lib/team";
import useAuthStore from "@/store/useAuthStore";

type Feedback = { type: "success" | "error"; message: string };

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
] as const;

const STATUS_OPTIONS = ["active", "inactive", "suspended"] as const;

const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoading, clear } = useAuthStore();

  const [teams, setTeams] = useState<Team[]>([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(true);
  const [isTeamsFetching, setIsTeamsFetching] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "" });
  const [teamStatus, setTeamStatus] = useState<Feedback | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [inviteForms, setInviteForms] = useState<Record<number, { email: string; role: string }>>({});
  const [inviteFeedback, setInviteFeedback] = useState<Record<number, Feedback | null>>({});
  const [invitePending, setInvitePending] = useState<Record<number, boolean>>({});
  const [memberDrafts, setMemberDrafts] = useState<Record<string, { role: string; status: string }>>({});
  const [memberFeedback, setMemberFeedback] = useState<Record<string, Feedback | null>>({});
  const [memberPending, setMemberPending] = useState<Record<string, boolean>>({});

  const totalMembers = useMemo(
    () => teams.reduce((count, team) => count + team.members.length, 0),
    [teams]
  );

  const { notifications, dismiss, clearAll } = useNotifications(Boolean(user));

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    if (!user) {
      setTeams([]);
      setInviteForms({});
      setInviteFeedback({});
      setInvitePending({});
      setMemberDrafts({});
      setMemberFeedback({});
      setMemberPending({});
      setIsTeamsLoading(true);
      setIsTeamsFetching(false);
    }
  }, [user]);

  const ensureInviteForm = useCallback((teamId: number) => {
    setInviteForms((prev) => {
      if (prev[teamId]) {
        return prev;
      }
      return { ...prev, [teamId]: { email: "", role: "member" } };
    });
  }, []);

  const loadTeams = useCallback(async () => {
    if (!user) {
      return;
    }
    setIsTeamsLoading(true);
    try {
      const { data } = await getTeams();
      setTeams(data);
      data.forEach((team) => ensureInviteForm(team.id));
    } catch (error) {
      console.error("Failed to load teams", error);
    } finally {
      setIsTeamsLoading(false);
    }
  }, [ensureInviteForm, user]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (isAxiosError(error)) {
      const data = error.response?.data;
      if (typeof data === "string") {
        return data;
      }
      if (data && typeof data === "object") {
        const detail = (data as Record<string, unknown>).detail;
        const message = (data as Record<string, unknown>).message;
        if (typeof detail === "string") {
          return detail;
        }
        if (typeof message === "string") {
          return message;
        }
      }
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

  const handleCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTeamStatus(null);
    const name = teamForm.name.trim();
    if (!name) {
      setTeamStatus({ type: "error", message: "Provide a team name." });
      return;
    }

    setIsCreatingTeam(true);
    try {
      const { data } = await createTeam({ name });
      setTeams((prev) => [data, ...prev]);
      ensureInviteForm(data.id);
      setTeamStatus({ type: "success", message: "Team created successfully." });
      setTeamForm({ name: "" });
    } catch (error) {
      setTeamStatus({
        type: "error",
        message: getErrorMessage(error, "Unable to create the team."),
      });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleInviteChange = (teamId: number, field: "email" | "role", value: string) => {
    setInviteForms((prev) => {
      const current = prev[teamId] ?? { email: "", role: "member" };
      return {
        ...prev,
        [teamId]: {
          email: field === "email" ? value : current.email,
          role: field === "role" ? value : current.role,
        },
      };
    });
  };

  const handleInviteSubmit = async (teamId: number, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ensureInviteForm(teamId);
    setInviteFeedback((prev) => ({ ...prev, [teamId]: null }));

    const current = inviteForms[teamId] ?? { email: "", role: "member" };
    if (!current.email) {
      setInviteFeedback((prev) => ({
        ...prev,
        [teamId]: { type: "error", message: "Provide an email to invite." },
      }));
      return;
    }

    setInvitePending((prev) => ({ ...prev, [teamId]: true }));
    try {
      const { data } = await inviteMember({
        teamId,
        email: current.email,
        role: current.role ?? "member",
      });
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? { ...team, members: updateMemberList(team.members, data) }
            : team
        )
      );
      setInviteFeedback((prev) => ({
        ...prev,
        [teamId]: { type: "success", message: "Invitation sent." },
      }));
      setInviteForms((prev) => ({
        ...prev,
        [teamId]: { email: "", role: current.role ?? "member" },
      }));
    } catch (error) {
      setInviteFeedback((prev) => ({
        ...prev,
        [teamId]: {
          type: "error",
          message: getErrorMessage(error, "Unable to send invitation."),
        },
      }));
    } finally {
      setInvitePending((prev) => ({ ...prev, [teamId]: false }));
    }
  };

  const updateMemberDraft = (
    teamId: number,
    member: TeamMember,
    field: "role" | "status",
    value: string
  ) => {
    const key = `${teamId}-${member.user_id}`;
    setMemberDrafts((prev) => {
      const current = prev[key] ?? { role: member.role, status: member.status };
      return {
        ...prev,
        [key]: {
          role: field === "role" ? value : current.role,
          status: field === "status" ? value : current.status,
        },
      };
    });
  };

  const handleMemberSubmit = async (teamId: number, member: TeamMember, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const key = `${teamId}-${member.user_id}`;
    const draft = memberDrafts[key] ?? { role: member.role, status: member.status };
    const payload: { role?: string; status?: string } = {};

    if (draft.role !== member.role) {
      payload.role = draft.role;
    }
    if (draft.status !== member.status) {
      payload.status = draft.status;
    }

    if (!payload.role && !payload.status) {
      setMemberFeedback((prev) => ({
        ...prev,
        [key]: { type: "error", message: "Update a field before saving." },
      }));
      return;
    }

    setMemberPending((prev) => ({ ...prev, [key]: true }));
    setMemberFeedback((prev) => ({ ...prev, [key]: null }));

    try {
      const { data } = await updateMember({ teamId, memberId: member.user_id, ...payload });
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? { ...team, members: updateMemberList(team.members, data) }
            : team
        )
      );
      setMemberFeedback((prev) => ({
        ...prev,
        [key]: { type: "success", message: "Member updated." },
      }));
      setMemberDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (error) {
      setMemberFeedback((prev) => ({
        ...prev,
        [key]: {
          type: "error",
          message: getErrorMessage(error, "Could not update member."),
        },
      }));
    } finally {
      setMemberPending((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleRefreshTeams = async () => {
    setIsTeamsFetching(true);
    try {
      const { data } = await getTeams();
      setTeams(data);
      data.forEach((team) => ensureInviteForm(team.id));
    } catch (error) {
      console.error("Failed to refresh teams", error);
    } finally {
      setIsTeamsFetching(false);
    }
  };

  const formatDate = (value: string, includeTime = false) => {
    const date = new Date(value);
    return includeTime
      ? date.toLocaleString()
      : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const formatPayload = (payload: Record<string, unknown>) => JSON.stringify(payload, null, 2);

  if (isLoading) {
    return <p className="center">Loading...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="dashboard">
      <section className="card hero-card">
        <div>
          <h1>
            Welcome back{user.first_name ? `, ${user.first_name}` : ""}!
          </h1>
          <p>Manage your workspace, invite collaborators, and stay in sync.</p>
        </div>
        <dl className="hero-stats">
          <div>
            <dt>Teams</dt>
            <dd>{isTeamsLoading && teams.length === 0 ? "…" : teams.length}</dd>
          </div>
          <div>
            <dt>Collaborators</dt>
            <dd>{totalMembers}</dd>
          </div>
        </dl>
      </section>

      <div className="dashboard-grid">
        <section className="card create-team-card">
          <header className="section-header">
            <div>
              <h2>Create a team</h2>
              <p>Spin up a new shared workspace in seconds.</p>
            </div>
          </header>
          <form className="stacked-form" onSubmit={handleCreateTeam}>
            <label>
              Team name
              <input
                name="team-name"
                placeholder="e.g. Platform Squad"
                value={teamForm.name}
                onChange={(event) => setTeamForm({ name: event.target.value })}
                required
              />
            </label>
            {teamStatus ? (
              <p className={teamStatus.type === "success" ? "form-success" : "form-error"}>
                {teamStatus.message}
              </p>
            ) : null}
            <button type="submit" disabled={isCreatingTeam}>
              {isCreatingTeam ? "Creating…" : "Create team"}
            </button>
          </form>
        </section>

        <section className="card teams-card">
          <header className="section-header">
            <div>
              <h2>Teams</h2>
              <p>{isTeamsFetching ? "Refreshing your teams…" : "Invite collaborators and manage roles."}</p>
            </div>
            <button className="ghost" type="button" onClick={handleRefreshTeams} disabled={isTeamsFetching}>
              {isTeamsFetching ? "Refreshing…" : "Refresh"}
            </button>
          </header>
          {teams.length === 0 && !isTeamsLoading ? (
            <p className="empty-state">
              You have not created any teams yet. Use the form on the left to get started.
            </p>
          ) : (
            <div className="teams-grid">
              {teams.map((team) => {
                const currentInvite = inviteForms[team.id] ?? { email: "", role: "member" };
                return (
                  <article key={team.id} className="team-card">
                    <header>
                      <div>
                        <h3>{team.name}</h3>
                        <span>{team.members.length} members</span>
                      </div>
                    </header>
                    <form className="inline-form" onSubmit={(event) => handleInviteSubmit(team.id, event)}>
                      <label>
                        Invite by email
                        <input
                          type="email"
                          name={`invite-${team.id}`}
                          value={currentInvite.email}
                          onChange={(event) => handleInviteChange(team.id, "email", event.target.value)}
                          placeholder="person@company.com"
                          required
                        />
                      </label>
                      <label>
                        Role
                        <select
                          value={currentInvite.role}
                          onChange={(event) => handleInviteChange(team.id, "role", event.target.value)}
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button type="submit" disabled={invitePending[team.id] ?? false}>
                        {invitePending[team.id] ? "Sending…" : "Send invite"}
                      </button>
                    </form>
                    {inviteFeedback[team.id] ? (
                      <p
                        className={
                          inviteFeedback[team.id]?.type === "success" ? "form-success" : "form-error"
                        }
                      >
                        {inviteFeedback[team.id]?.message}
                      </p>
                    ) : null}
                    <ul className="team-member-list">
                      {team.members.map((member) => {
                        const key = `${team.id}-${member.user_id}`;
                        const draft = memberDrafts[key] ?? { role: member.role, status: member.status };
                        return (
                          <li key={member.user_id}>
                            <div className="member-meta">
                              <div>
                                <strong>{member.email}</strong>
                                <span>{member.role}</span>
                              </div>
                              <span className={`status-tag status-${member.status}`}>
                                {member.status}
                              </span>
                            </div>
                            <form className="member-form" onSubmit={(event) => handleMemberSubmit(team.id, member, event)}>
                              <label>
                                Role
                                <select
                                  value={draft.role}
                                  onChange={(event) =>
                                    updateMemberDraft(team.id, member, "role", event.target.value)
                                  }
                                >
                                  {ROLE_OPTIONS.map((role) => (
                                    <option key={role.value} value={role.value}>
                                      {role.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Status
                                <select
                                  value={draft.status}
                                  onChange={(event) =>
                                    updateMemberDraft(team.id, member, "status", event.target.value)
                                  }
                                >
                                  {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                      {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <button type="submit" disabled={memberPending[key] ?? false}>
                                {memberPending[key] ? "Updating…" : "Update"}
                              </button>
                            </form>
                            {memberFeedback[key] ? (
                              <p
                                className={
                                  memberFeedback[key]?.type === "success" ? "form-success" : "form-error"
                                }
                              >
                                {memberFeedback[key]?.message}
                              </p>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="card account-card">
          <header className="section-header">
            <div>
              <h2>Account overview</h2>
              <p>Django backend mirrors the FastAPI functionality.</p>
            </div>
            <button className="ghost" type="button" onClick={clear}>
              Sign out
            </button>
          </header>
          <ul className="overview-list">
            <li>
              <span>Email</span>
              <strong>{user.email}</strong>
            </li>
            <li>
              <span>Verified</span>
              <strong>{user.is_email_verified ? "Yes" : "Pending"}</strong>
            </li>
            <li>
              <span>Member since</span>
              <strong>{user.created_at ? formatDate(user.created_at) : "—"}</strong>
            </li>
          </ul>
        </section>

        {notifications.length > 0 ? (
          <section className="card notifications-card">
            <header className="section-header">
              <div>
                <h2>Live notifications</h2>
                <p>Realtime updates from invitations and profile changes.</p>
              </div>
              <button className="link-button" type="button" onClick={clearAll}>
                Clear all
              </button>
            </header>
            <ul className="notifications-list">
              {notifications.map((note) => (
                <li key={note.id}>
                  <div>
                    <strong>{note.event}</strong>
                    <time>{formatDate(note.receivedAt, true)}</time>
                  </div>
                  <pre>{formatPayload(note.payload)}</pre>
                  <button className="link-button" type="button" onClick={() => dismiss(note.id)}>
                    Dismiss
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
};

const updateMemberList = (members: TeamMember[], updated: TeamMember) => {
  const index = members.findIndex((item) => item.user_id === updated.user_id);
  if (index === -1) {
    return [updated, ...members];
  }
  const next = [...members];
  next.splice(index, 1, updated);
  return next;
};

export default DashboardPage;
