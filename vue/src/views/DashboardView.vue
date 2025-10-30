<template>
  <main class="dashboard-page">
    <section class="card hero-card">
      <div>
        <h1>
          Welcome back<span v-if="auth.user?.first_name">, {{ auth.user?.first_name }}</span>!
        </h1>
        <p>Manage your teams, send invitations, and stay in sync across apps.</p>
      </div>
      <dl class="hero-stats">
        <div>
          <dt>Teams</dt>
          <dd>{{ teamStore.isLoading && !teamStore.teams.length ? "…" : teamStore.teams.length }}</dd>
        </div>
        <div>
          <dt>Collaborators</dt>
          <dd>{{ totalMembers }}</dd>
        </div>
      </dl>
    </section>

    <div class="dashboard-grid">
      <section class="card create-team-card">
        <header class="section-header">
          <div>
            <h2>Create a team</h2>
            <p>Spin up a new shared workspace in seconds.</p>
          </div>
        </header>
        <form class="stacked-form" @submit.prevent="handleCreateTeam">
          <label>
            Team name
            <input
              name="team-name"
              placeholder="e.g. Platform Squad"
              v-model="teamForm.name"
              required
            />
          </label>
          <p
            v-if="teamStatus"
            :class="teamStatus.type === 'success' ? 'form-success' : 'form-error'"
          >
            {{ teamStatus.message }}
          </p>
          <button type="submit" :disabled="isCreatingTeam">
            {{ isCreatingTeam ? "Creating…" : "Create team" }}
          </button>
        </form>
      </section>

      <section class="card teams-card">
        <header class="section-header">
          <div>
            <h2>Teams</h2>
            <p>
              {{ teamStore.isLoading ? "Loading your teams…" : "Invite collaborators and manage roles." }}
            </p>
          </div>
        </header>
        <p v-if="!teamStore.teams.length && !teamStore.isLoading" class="empty-state">
          You have not created any teams yet. Use the form on the left to get started.
        </p>
        <div v-else class="teams-grid">
          <article v-for="team in teamStore.teams" :key="team.id" class="team-card">
            <header>
              <div>
                <h3>{{ team.name }}</h3>
                <span>{{ team.members.length }} members</span>
              </div>
            </header>

            <form class="inline-form" @submit.prevent="handleInviteSubmit(team.id)">
              <label>
                Invite by email
                <input
                  type="email"
                  :name="`invite-${team.id}`"
                  v-model="inviteForms[team.id].email"
                  placeholder="person@company.com"
                  required
                />
              </label>
              <label>
                Role
                <select v-model="inviteForms[team.id].role">
                  <option v-for="role in ROLE_OPTIONS" :key="role.value" :value="role.value">
                    {{ role.label }}
                  </option>
                </select>
              </label>
              <button type="submit" :disabled="invitePending[team.id]">
                {{ invitePending[team.id] ? "Sending…" : "Send invite" }}
              </button>
            </form>
            <p
              v-if="inviteFeedback[team.id]"
              :class="inviteFeedback[team.id]?.type === 'success' ? 'form-success' : 'form-error'"
            >
              {{ inviteFeedback[team.id]?.message }}
            </p>

            <ul class="team-member-list">
              <li v-for="member in team.members" :key="member.user_id">
                <div class="member-meta">
                  <div>
                    <strong>{{ member.email }}</strong>
                    <span>{{ member.role }}</span>
                  </div>
                  <span :class="['status-tag', `status-${member.status}`]">
                    {{ member.status }}
                  </span>
                </div>
                <form class="member-form" @submit.prevent="handleMemberSubmit(team.id, member)">
                  <label>
                    Role
                    <select
                      :value="memberDrafts[`${team.id}-${member.user_id}`]?.role ?? member.role"
                      @change="handleMemberDraftChange(team.id, member, 'role', ($event.target as HTMLSelectElement).value)"
                    >
                      <option v-for="role in ROLE_OPTIONS" :key="role.value" :value="role.value">
                        {{ role.label }}
                      </option>
                    </select>
                  </label>
                  <label>
                    Status
                    <select
                      :value="memberDrafts[`${team.id}-${member.user_id}`]?.status ?? member.status"
                      @change="handleMemberDraftChange(team.id, member, 'status', ($event.target as HTMLSelectElement).value)"
                    >
                      <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">
                        {{ status.charAt(0).toUpperCase() + status.slice(1) }}
                      </option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    :disabled="memberPending[`${team.id}-${member.user_id}`]"
                  >
                    {{ memberPending[`${team.id}-${member.user_id}`] ? "Updating…" : "Update" }}
                  </button>
                </form>
                <p
                  v-if="memberFeedback[`${team.id}-${member.user_id}`]"
                  :class="memberFeedback[`${team.id}-${member.user_id}`]?.type === 'success' ? 'form-success' : 'form-error'"
                >
                  {{ memberFeedback[`${team.id}-${member.user_id}`]?.message }}
                </p>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section class="card account-card">
        <header class="section-header">
          <div>
            <h2>Account overview</h2>
            <p>Django API is synced with FastAPI features.</p>
          </div>
          <button class="ghost" type="button" @click="handleLogout">Sign out</button>
        </header>
        <ul class="overview-list">
          <li>
            <span>Email</span>
            <strong>{{ auth.user?.email }}</strong>
          </li>
          <li>
            <span>Verified</span>
            <strong>{{ auth.user?.is_email_verified ? "Yes" : "Pending" }}</strong>
          </li>
          <li>
            <span>Member since</span>
            <strong>
              {{ auth.user?.created_at ? formatDate(auth.user?.created_at) : "—" }}
            </strong>
          </li>
        </ul>
      </section>

      <section v-if="notifications.length" class="card notifications-card">
        <header class="section-header">
          <div>
            <h2>Live notifications</h2>
            <p>Realtime updates from invitations, profile changes, and more.</p>
          </div>
          <button class="link-button" type="button" @click="clearAll">Clear all</button>
        </header>
        <ul class="notifications-list">
          <li v-for="note in notifications" :key="note.id">
            <div>
              <strong>{{ note.event }}</strong>
              <time>{{ formatDate(note.receivedAt, true) }}</time>
            </div>
            <pre>{{ formatPayload(note.payload) }}</pre>
            <button class="link-button" type="button" @click="dismiss(note.id)">Dismiss</button>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { isAxiosError } from "axios";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

import type { TeamMember } from "@/api/teams";
import { useNotifications } from "@/composables/useNotifications";
import { useAuthStore } from "@/store/auth";
import { useTeamStore } from "@/store/teams";

type Feedback = { type: "success" | "error"; message: string };

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
] as const;

const STATUS_OPTIONS = ["active", "inactive", "suspended"] as const;

const auth = useAuthStore();
const teamStore = useTeamStore();
const router = useRouter();

const isAuthenticated = computed(() => Boolean(auth.user));
const { notifications, dismiss, clearAll } = useNotifications(isAuthenticated);

const teamForm = reactive({ name: "" });
const teamStatus = ref<Feedback | null>(null);
const isCreatingTeam = ref(false);

const inviteForms = reactive<Record<number, { email: string; role: string }>>({});
const inviteFeedback = reactive<Record<number, Feedback | null>>({});
const invitePending = reactive<Record<number, boolean>>({});

const memberDrafts = reactive<Record<string, { role: string; status: string }>>({});
const memberFeedback = reactive<Record<string, Feedback | null>>({});
const memberPending = reactive<Record<string, boolean>>({});

const totalMembers = computed(() =>
  teamStore.teams.reduce((count, team) => count + team.members.length, 0)
);

const ensureInviteForm = (teamId: number) => {
  if (!inviteForms[teamId]) {
    inviteForms[teamId] = { email: "", role: "member" };
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") {
      return data;
    }
    if (data && typeof data === "object") {
      if ("detail" in data && typeof data.detail === "string") {
        return data.detail;
      }
      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const formatDate = (value: string, includeTime = false) => {
  const date = new Date(value);
  return includeTime
    ? date.toLocaleString()
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const formatPayload = (payload: Record<string, unknown>) =>
  JSON.stringify(payload, null, 2);

onMounted(async () => {
  if (!teamStore.teams.length) {
    await teamStore.loadTeams();
  }
  teamStore.teams.forEach((team) => ensureInviteForm(team.id));
});

const handleCreateTeam = async () => {
  teamStatus.value = null;
  const name = teamForm.name.trim();
  if (!name) {
    teamStatus.value = { type: "error", message: "Provide a team name." };
    return;
  }

  isCreatingTeam.value = true;
  try {
    const team = await teamStore.create({ name });
    ensureInviteForm(team.id);
    teamStatus.value = { type: "success", message: "Team created successfully." };
    teamForm.name = "";
  } catch (error) {
    teamStatus.value = {
      type: "error",
      message: getErrorMessage(error, "Unable to create the team."),
    };
  } finally {
    isCreatingTeam.value = false;
  }
};

const handleInviteSubmit = async (teamId: number) => {
  ensureInviteForm(teamId);
  inviteFeedback[teamId] = null;
  const current = inviteForms[teamId];
  if (!current.email) {
    inviteFeedback[teamId] = { type: "error", message: "Provide an email to invite." };
    return;
  }

  invitePending[teamId] = true;
  try {
    await teamStore.invite({ teamId, email: current.email, role: current.role });
    inviteFeedback[teamId] = { type: "success", message: "Invitation sent." };
    inviteForms[teamId] = { email: "", role: current.role };
  } catch (error) {
    inviteFeedback[teamId] = {
      type: "error",
      message: getErrorMessage(error, "Unable to send invitation."),
    };
  } finally {
    invitePending[teamId] = false;
  }
};

const handleMemberDraftChange = (
  teamId: number,
  member: TeamMember,
  field: "role" | "status",
  value: string
) => {
  const key = `${teamId}-${member.user_id}`;
  const current = memberDrafts[key] ?? { role: member.role, status: member.status };
  memberDrafts[key] = {
    role: field === "role" ? value : current.role,
    status: field === "status" ? value : current.status,
  };
};

const handleMemberSubmit = async (teamId: number, member: TeamMember) => {
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
    memberFeedback[key] = { type: "error", message: "Update a field before saving." };
    return;
  }

  memberPending[key] = true;
  memberFeedback[key] = null;

  try {
    await teamStore.update({ teamId, memberId: member.user_id, ...payload });
    memberFeedback[key] = { type: "success", message: "Member updated." };
    delete memberDrafts[key];
  } catch (error) {
    memberFeedback[key] = {
      type: "error",
      message: getErrorMessage(error, "Could not update member."),
    };
  } finally {
    memberPending[key] = false;
  }
};

const handleLogout = async () => {
  auth.clear();
  teamStore.reset();
  await router.replace({ name: "login" });
};

watch(
  () => teamStore.teams.map((team) => team.id),
  (ids) => {
    ids.forEach((id) => ensureInviteForm(id));
  },
  { immediate: true }
);
</script>
