from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView,
    MentorListView, MentorDetailView, MentorMeView, MentorReviewListView,
    AdminMentorListView, AdminMentorVerifyView, AdminMentorRejectView,
    SessionListCreateView, SessionDetailView,
    SessionAcceptView, SessionDeclineView, SessionCompleteView, SessionCancelView,
    SessionReviewView,
    ResourceListCreateView, ResourceDetailView,
    AdminStatsView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────
    path('auth/register/',        RegisterView.as_view(),      name='auth-register'),
    path('auth/login/',           LoginView.as_view(),          name='auth-login'),
    path('auth/refresh/',         TokenRefreshView.as_view(),   name='auth-refresh'),

    # ── Mentor Profiles (public) ───────────────────────────────────────────
    path('mentors/',                      MentorListView.as_view(),         name='mentor-list'),
    path('mentors/me/',                   MentorMeView.as_view(),           name='mentor-me'),
    path('mentors/<int:pk>/',             MentorDetailView.as_view(),       name='mentor-detail'),
    path('mentors/<int:pk>/reviews/',     MentorReviewListView.as_view(),   name='mentor-reviews'),

    # ── Admin — Mentor Management ──────────────────────────────────────────
    path('admin/mentors/',                      AdminMentorListView.as_view(),   name='admin-mentor-list'),
    path('admin/mentors/<int:pk>/verify/',      AdminMentorVerifyView.as_view(), name='admin-mentor-verify'),
    path('admin/mentors/<int:pk>/reject/',      AdminMentorRejectView.as_view(), name='admin-mentor-reject'),

    # ── Sessions ───────────────────────────────────────────────────────────
    path('sessions/',                           SessionListCreateView.as_view(), name='session-list-create'),
    path('sessions/<int:pk>/',                  SessionDetailView.as_view(),     name='session-detail'),
    path('sessions/<int:pk>/accept/',           SessionAcceptView.as_view(),     name='session-accept'),
    path('sessions/<int:pk>/decline/',          SessionDeclineView.as_view(),    name='session-decline'),
    path('sessions/<int:pk>/complete/',         SessionCompleteView.as_view(),   name='session-complete'),
    path('sessions/<int:pk>/cancel/',           SessionCancelView.as_view(),     name='session-cancel'),

    # ── Reviews ────────────────────────────────────────────────────────────
    path('sessions/<int:pk>/review/',           SessionReviewView.as_view(),     name='session-review'),

    # ── Resources ──────────────────────────────────────────────────────────
    path('resources/',                          ResourceListCreateView.as_view(), name='resource-list-create'),
    path('resources/<int:pk>/',                 ResourceDetailView.as_view(),     name='resource-detail'),

    # ── Admin Stats ────────────────────────────────────────────────────────
    path('admin/stats/',                        AdminStatsView.as_view(),         name='admin-stats'),
]
