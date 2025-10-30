import { createApi } from "@reduxjs/toolkit/query/react";

import { axiosBaseQuery } from "@/api/axiosBaseQuery";
import { TEAM_ENDPOINTS } from "./endpoints";
import type {
  CreateTeamPayload,
  InviteMemberPayload,
  Team,
  TeamMember,
  UpdateMemberPayload,
} from "@/types/team/teamTypes";

export const teamApi = createApi({
  reducerPath: "teamApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Teams"],
  endpoints: (builder) => ({
    getTeams: builder.query<Team[], void>({
      query: () => ({
        url: TEAM_ENDPOINTS.root,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              { type: "Teams", id: "LIST" },
              ...result.map((team) => ({ type: "Teams" as const, id: team.id })),
            ]
          : [{ type: "Teams", id: "LIST" }],
    }),
    createTeam: builder.mutation<Team, CreateTeamPayload>({
      query: (payload) => ({
        url: TEAM_ENDPOINTS.root,
        method: "POST",
        data: payload,
      }),
      invalidatesTags: [{ type: "Teams", id: "LIST" }],
    }),
    inviteMember: builder.mutation<TeamMember, InviteMemberPayload>({
      query: ({ teamId, ...payload }) => ({
        url: TEAM_ENDPOINTS.invite(teamId),
        method: "POST",
        data: payload,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Teams", id: arg.teamId },
        { type: "Teams", id: "LIST" },
      ],
    }),
    updateMember: builder.mutation<TeamMember, UpdateMemberPayload>({
      query: ({ teamId, memberId, ...payload }) => ({
        url: TEAM_ENDPOINTS.member(teamId, memberId),
        method: "PATCH",
        data: payload,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Teams", id: arg.teamId },
        { type: "Teams", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetTeamsQuery,
  useCreateTeamMutation,
  useInviteMemberMutation,
  useUpdateMemberMutation,
} = teamApi;
