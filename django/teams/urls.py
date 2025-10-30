from __future__ import annotations

from django.urls import re_path

from .views import TeamInviteView, TeamListCreateView, TeamMemberUpdateView

urlpatterns = [
    re_path(r"^$", TeamListCreateView.as_view(), name="team-list"),
    re_path(r"^(?P<team_id>\d+)/invite/?$", TeamInviteView.as_view(), name="team-invite"),
    re_path(
        r"^(?P<team_id>\d+)/members/(?P<member_id>\d+)/?$",
        TeamMemberUpdateView.as_view(),
        name="team-member-update",
    ),
]
