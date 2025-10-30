export type TeamMember = {
  user_id: number;
  email: string;
  role: string;
  status: string;
  invited_by_id: number | null;
  joined_at: string;
};

export type Team = {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  members: TeamMember[];
};

export type CreateTeamPayload = {
  name: string;
};

export type InviteMemberPayload = {
  teamId: number;
  email: string;
  role: string;
};

export type UpdateMemberPayload = {
  teamId: number;
  memberId: number;
  role?: string;
  status?: string;
};
