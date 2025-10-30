import { FormEvent, useMemo, useState } from "react";

import {
  useCreateTeamMutation,
  useGetTeamsQuery,
  useInviteMemberMutation,
  useUpdateMemberMutation,
} from "@/api/team/teamApi";
import type { TeamMember } from "@/types/team/teamTypes";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/error";

type Feedback = { type: "success" | "error"; message: string };

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
] as const;

const STATUS_OPTIONS = ["active", "inactive", "suspended"] as const;

const DashboardPage = () => {
  const { user } = useAuth();
  const {
    data: teams = [],
    isLoading: isTeamsLoading,
    isFetching: isTeamsFetching,
  } = useGetTeamsQuery();
  const [createTeam, { isLoading: isCreatingTeam }] = useCreateTeamMutation();
  const [inviteMember, { isLoading: isInviting }] = useInviteMemberMutation();
  const [updateMember, { isLoading: isUpdatingMember }] = useUpdateMemberMutation();

  const [teamForm, setTeamForm] = useState({ name: "" });
  const [teamStatus, setTeamStatus] = useState<Feedback | null>(null);
  const [inviteForms, setInviteForms] = useState<
    Record<number, { email: string; role: string }>
  >({});
  const [inviteFeedback, setInviteFeedback] = useState<Record<number, Feedback | null>>({});
  const [memberDrafts, setMemberDrafts] = useState<
    Record<string, { role: string; status: string }>
  >({});
  const [memberFeedback, setMemberFeedback] = useState<Record<string, Feedback | null>>({});

  const totalMembers = useMemo(
    () => teams.reduce((count, team) => count + team.members.length, 0),
    [teams]
  );

  const handleCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTeamStatus(null);

    try {
      await createTeam({ name: teamForm.name.trim() }).unwrap();
      setTeamStatus({ type: "success", message: "Team created successfully." });
      setTeamForm({ name: "" });
    } catch (error) {
      setTeamStatus({
        type: "error",
        message: getErrorMessage(error, "Unable to create the team."),
      });
    }
  };

  const handleInviteChange = (
    teamId: number,
    field: "email" | "role",
    value: string
  ) => {
    setInviteForms((prev) => ({
      ...prev,
      [teamId]: {
        email: field === "email" ? value : prev[teamId]?.email ?? "",
        role: field === "role" ? value : prev[teamId]?.role ?? "member",
      },
    }));
  };

  const handleInviteSubmit = async (
    teamId: number,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setInviteFeedback((prev) => ({ ...prev, [teamId]: null }));

    const current = inviteForms[teamId];
    if (!current?.email) {
      setInviteFeedback((prev) => ({
        ...prev,
        [teamId]: { type: "error", message: "Provide an email to invite." },
      }));
      return;
    }

    try {
      await inviteMember({
        teamId,
        email: current.email,
        role: current.role || "member",
      }).unwrap();
      setInviteFeedback((prev) => ({
        ...prev,
        [teamId]: { type: "success", message: "Invitation sent." },
      }));
      setInviteForms((prev) => ({
        ...prev,
        [teamId]: { email: "", role: current.role },
      }));
    } catch (error) {
      setInviteFeedback((prev) => ({
        ...prev,
        [teamId]: {
          type: "error",
          message: getErrorMessage(error, "Unable to send invitation."),
        },
      }));
    }
  };

  const handleMemberDraftChange = (
    teamId: number,
    member: TeamMember,
    field: "role" | "status",
    value: string
  ) => {
    const key = `${teamId}-${member.user_id}`;
    setMemberDrafts((prev) => ({
      ...prev,
      [key]: {
        role: field === "role" ? value : prev[key]?.role ?? member.role,
        status: field === "status" ? value : prev[key]?.status ?? member.status,
      },
    }));
  };

  const handleMemberSubmit = async (
    teamId: number,
    member: TeamMember,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const key = `${teamId}-${member.user_id}`;
    const draft = memberDrafts[key];
    const selectedRole = draft?.role ?? member.role;
    const selectedStatus = draft?.status ?? member.status;

    const payload: { role?: string; status?: string } = {};
    if (selectedRole !== member.role) {
      payload.role = selectedRole;
    }
    if (selectedStatus !== member.status) {
      payload.status = selectedStatus;
    }

    if (!payload.role && !payload.status) {
      setMemberFeedback((prev) => ({
        ...prev,
        [key]: { type: "error", message: "Update a field before saving." },
      }));
      return;
    }

    try {
      await updateMember({
        teamId,
        memberId: member.user_id,
        ...payload,
      }).unwrap();
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
    }
  };

  return (
    <div className="dashboard">
      <section className="card hero-card">
        <div>
          <h1>
            Welcome back{user?.first_name ? `, ${user.first_name}` : ""}!
          </h1>
          <p>
            Manage your workspace, update your profile, and collaborate with
            your team in real time.
          </p>
        </div>
        <dl className="hero-stats">
          <div>
            <dt>Teams</dt>
            <dd>{isTeamsLoading && teams.length === 0 ? "..." : teams.length}</dd>
          </div>
          <div>
            <dt>Collaborators</dt>
            <dd>{totalMembers}</dd>
          </div>
        </dl>
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <header className="section-header">
            <div>
              <h2>Create a team</h2>
              <p>Spin up a new shared space in seconds.</p>
            </div>
          </header>
          <form className="stacked-form" onSubmit={handleCreateTeam}>
            <label>
              Team name
              <input
                name="team-name"
                placeholder="e.g. Platform Squad"
                value={teamForm.name}
                onChange={(event) =>
                  setTeamForm({ name: event.currentTarget.value })
                }
                required
              />
            </label>
            {teamStatus ? (
              <p
                className={
                  teamStatus.type === "success" ? "form-success" : "form-error"
                }
              >
                {teamStatus.message}
              </p>
            ) : null}
            <button type="submit" disabled={isCreatingTeam}>
              {isCreatingTeam ? "Creating..." : "Create team"}
            </button>
          </form>
        </section>

        <section className="card">
          <header className="section-header">
            <div>
              <h2>Teams</h2>
              <p>
                {isTeamsFetching
                  ? "Refreshing your teams..."
                  : "Invite collaborators and manage roles."}
              </p>
            </div>
          </header>
          {teams.length === 0 ? (
            <p className="empty-state">
              You have not created any teams yet. Use the form on the left to
              get started.
            </p>
          ) : (
            <div className="teams-grid">
              {teams.map((team) => (
                <article key={team.id} className="team-card">
                  <header>
                    <div>
                      <h3>{team.name}</h3>
                      <span>{team.members.length} members</span>
                    </div>
                  </header>
                  <form
                    className="inline-form"
                    onSubmit={(event) => handleInviteSubmit(team.id, event)}
                  >
                    <label>
                      Invite by email
                      <input
                        type="email"
                        name={`invite-${team.id}`}
                        value={inviteForms[team.id]?.email ?? ""}
                        onChange={(event) =>
                          handleInviteChange(team.id, "email", event.target.value)
                        }
                        placeholder="person@company.com"
                        required
                      />
                    </label>
                    <label>
                      Role
                      <select
                        value={inviteForms[team.id]?.role ?? "member"}
                        onChange={(event) =>
                          handleInviteChange(team.id, "role", event.target.value)
                        }
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" disabled={isInviting}>
                      {isInviting ? "Sending..." : "Send invite"}
                    </button>
                  </form>
                  {inviteFeedback[team.id] ? (
                    <p
                      className={
                        inviteFeedback[team.id]?.type === "success"
                          ? "form-success"
                          : "form-error"
                      }
                    >
                      {inviteFeedback[team.id]?.message}
                    </p>
                  ) : null}
                  <ul className="team-member-list">
                    {team.members.map((member) => {
                      const key = `${team.id}-${member.user_id}`;
                      const roleValue =
                        memberDrafts[key]?.role ?? member.role;
                      const statusValue =
                        memberDrafts[key]?.status ?? member.status;
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
                          <form
                            className="member-form"
                            onSubmit={(event) =>
                              handleMemberSubmit(team.id, member, event)
                            }
                          >
                            <label>
                              Role
                              <select
                                value={roleValue}
                                onChange={(event) =>
                                  handleMemberDraftChange(
                                    team.id,
                                    member,
                                    "role",
                                    event.target.value
                                  )
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
                                value={statusValue}
                                onChange={(event) =>
                                  handleMemberDraftChange(
                                    team.id,
                                    member,
                                    "status",
                                    event.target.value
                                  )
                                }
                              >
                                {STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <button type="submit" disabled={isUpdatingMember}>
                              {isUpdatingMember ? "Updating..." : "Update"}
                            </button>
                          </form>
                          {memberFeedback[key] ? (
                            <p
                              className={
                                memberFeedback[key]?.type === "success"
                                  ? "form-success"
                                  : "form-error"
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
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <header className="section-header">
            <div>
              <h2>Account overview</h2>
              <p>FastAPI is connected and ready to go.</p>
            </div>
          </header>
          <ul className="overview-list">
            <li>
              <span>Email</span>
              <strong>{user?.email}</strong>
            </li>
            <li>
              <span>Verified</span>
              <strong>{user?.is_email_verified ? "Yes" : "Pending"}</strong>
            </li>
            <li>
              <span>Member since</span>
              <strong>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "-"}
              </strong>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
