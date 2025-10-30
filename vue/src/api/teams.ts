import { API_ENDPOINTS } from "./config";
import api from "./client";

export interface TeamMember {
  user_id: number;
  email: string;
  role: string;
  status: string;
  invited_by_id: number | null;
  joined_at: string;
}

export interface Team {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  members: TeamMember[];
}

export interface CreateTeamPayload {
  name: string;
}

export interface InviteMemberPayload {
  teamId: number;
  email: string;
  role: string;
}

export interface UpdateMemberPayload {
  teamId: number;
  memberId: number;
  role?: string;
  status?: string;
}

export const fetchTeams = () => api.get<Team[]>(API_ENDPOINTS.teams.root);

export const createTeam = (payload: CreateTeamPayload) =>
  api.post<Team>(API_ENDPOINTS.teams.root, payload);

export const inviteMember = ({ teamId, ...payload }: InviteMemberPayload) =>
  api.post<TeamMember>(API_ENDPOINTS.teams.invite(teamId), payload);

export const updateMember = ({ teamId, memberId, ...payload }: UpdateMemberPayload) =>
  api.patch<TeamMember>(API_ENDPOINTS.teams.member(teamId, memberId), payload);
