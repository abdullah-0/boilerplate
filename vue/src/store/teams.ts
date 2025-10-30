import { defineStore } from "pinia";
import { ref } from "vue";

import {
  createTeam,
  fetchTeams,
  inviteMember,
  updateMember,
  type CreateTeamPayload,
  type InviteMemberPayload,
  type Team,
  type TeamMember,
  type UpdateMemberPayload,
} from "@/api/teams";

export const useTeamStore = defineStore("teams", () => {
  const teams = ref<Team[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const setTeamMember = (teamId: number, member: TeamMember) => {
    const targetTeam = teams.value.find((item) => item.id === teamId);
    if (!targetTeam) {
      return;
    }
    const idx = targetTeam.members.findIndex((item) => item.user_id === member.user_id);
    if (idx >= 0) {
      targetTeam.members.splice(idx, 1, member);
    } else {
      targetTeam.members.unshift(member);
    }
  };

  const loadTeams = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await fetchTeams();
      teams.value = data;
    } catch (err) {
      console.error(err);
      error.value = "Unable to load your teams.";
    } finally {
      isLoading.value = false;
    }
  };

  const create = async (payload: CreateTeamPayload) => {
    const { data } = await createTeam(payload);
    teams.value = [data, ...teams.value];
    return data;
  };

  const invite = async (payload: InviteMemberPayload) => {
    const { teamId } = payload;
    const { data } = await inviteMember(payload);
    setTeamMember(teamId, data);
    return data;
  };

  const update = async (payload: UpdateMemberPayload) => {
    const { teamId } = payload;
    const { data } = await updateMember(payload);
    setTeamMember(teamId, data);
    return data;
  };

  const reset = () => {
    teams.value = [];
    isLoading.value = false;
    error.value = null;
  };

  return {
    teams,
    isLoading,
    error,
    loadTeams,
    create,
    invite,
    update,
    reset,
  };
});
