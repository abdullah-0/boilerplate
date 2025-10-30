from django.contrib import admin
from django.urls import include, path, re_path

urlpatterns = [
    path("admin/", admin.site.urls),
    re_path(r"^api/v1/auth/?", include("accounts.urls")),
    re_path(r"^api/v1/user/?", include("accounts.urls")),
    re_path(r"^api/v1/teams/?", include("teams.urls")),
]
