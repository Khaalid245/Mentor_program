from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView,
    MentorListView, MentorDetailView, MentorMeView, MentorReviewListView,
    AdminMentorListView, AdminMentorVerifyView, AdminMentorRejectView,
    SessionListCreateView, SessionDetailView,
    SessionAcceptView, SessionDeclineView, SessionCompleteView, SessionCancelView,
    SessionReviewView, SessionFeedbackView, SessionReportView,
    ResourceListCreateView, ResourceDetailView,
    AdminStatsView,
    AdminMeView, AdminPlatformSettingsView, AdminNotificationSettingsView,
    AdminUserListView, AdminUserDetailView,
    AdminUserSuspendView, AdminUserUnsuspendView, AdminUserDeactivateView,
    AdminSessionListView, AdminSessionCancelView,
    AdminReportListView, AdminReportResolveView, AdminReportDismissView,
    AdminAuditLogView,
    MentorFavoriteListView, MentorFavoriteToggleView,
    SavedSearchListCreateView, SavedSearchDetailView,
    MentorAvailabilityView,
    MessageListCreateView, ConversationListView, MessageMarkAsReadView, UnreadMessageCountView,
    SessionAnalyticsDetailView, StudentAnalyticsView, MentorAnalyticsView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────
    path('auth/register/',        RegisterView.as_view(),      name='auth-register'),
    path('auth/login/',           LoginView.as_view(),          name='auth-login'),
    path('auth/refresh/',         TokenRefreshView.as_view(),   name='auth-refresh'),
    path('auth/me/',              AdminMeView.as_view(),        name='auth-me'),

    # ── Mentor Profiles (public) ───────────────────────────────────────────
    path('mentors/',                      MentorListView.as_view(),         name='mentor-list'),
    path('mentors/me/',                   MentorMeView.as_view(),           name='mentor-me'),
    path('mentors/<int:pk>/',             MentorDetailView.as_view(),       name='mentor-detail'),
    path('mentors/<int:pk>/reviews/',     MentorReviewListView.as_view(),   name='mentor-reviews'),
    path('mentors/<int:pk>/availability/', MentorAvailabilityView.as_view(), name='mentor-availability'),

    # ── Admin — Mentor Management ──────────────────────────────────────────
    path('admin/mentors/',                      AdminMentorListView.as_view(),   name='admin-mentor-list'),
    path('admin/mentors/<int:pk>/verify/',      AdminMentorVerifyView.as_view(), name='admin-mentor-verify'),
    path('admin/mentors/<int:pk>/reject/',      AdminMentorRejectView.as_view(), name='admin-mentor-reject'),

    # ── Admin — Session Management ────────────────────────────────────────
    path('admin/sessions/',                     AdminSessionListView.as_view(),    name='admin-session-list'),
    path('admin/sessions/<int:pk>/cancel/',     AdminSessionCancelView.as_view(),  name='admin-session-cancel'),

    # ── Admin — User Management ────────────────────────────────────────────
    path('admin/users/',                        AdminUserListView.as_view(),       name='admin-user-list'),
    path('admin/users/<int:pk>/',               AdminUserDetailView.as_view(),     name='admin-user-detail'),
    path('admin/users/<int:pk>/suspend/',       AdminUserSuspendView.as_view(),    name='admin-user-suspend'),
    path('admin/users/<int:pk>/unsuspend/',     AdminUserUnsuspendView.as_view(),  name='admin-user-unsuspend'),
    path('admin/users/<int:pk>/deactivate/',    AdminUserDeactivateView.as_view(), name='admin-user-deactivate'),

    # ── Sessions ───────────────────────────────────────────────────────────
    path('sessions/',                           SessionListCreateView.as_view(), name='session-list-create'),
    path('sessions/<int:pk>/',                  SessionDetailView.as_view(),     name='session-detail'),
    path('sessions/<int:pk>/accept/',           SessionAcceptView.as_view(),     name='session-accept'),
    path('sessions/<int:pk>/decline/',          SessionDeclineView.as_view(),    name='session-decline'),
    path('sessions/<int:pk>/complete/',         SessionCompleteView.as_view(),   name='session-complete'),
    path('sessions/<int:pk>/cancel/',           SessionCancelView.as_view(),     name='session-cancel'),

    # ── Reviews ────────────────────────────────────────────────────────────
    path('sessions/<int:pk>/review/',           SessionReviewView.as_view(),     name='session-review'),
    
    # ── Student Feedback (Mentor → Student) ────────────────────────────────
    path('sessions/<int:pk>/feedback/',         SessionFeedbackView.as_view(),   name='session-feedback'),

    # ── Reports ────────────────────────────────────────────────────────────
    path('sessions/<int:pk>/report/',           SessionReportView.as_view(),     name='session-report'),

    # ── Admin — Reports ────────────────────────────────────────────────────
    path('admin/reports/',                      AdminReportListView.as_view(),    name='admin-report-list'),
    path('admin/reports/<int:pk>/resolve/',     AdminReportResolveView.as_view(), name='admin-report-resolve'),
    path('admin/reports/<int:pk>/dismiss/',     AdminReportDismissView.as_view(), name='admin-report-dismiss'),

    # ── Admin — Audit Log ──────────────────────────────────────────────────
    path('admin/audit-log/',                    AdminAuditLogView.as_view(),      name='admin-audit-log'),

    # ── Resources ──────────────────────────────────────────────────────────
    path('resources/',                          ResourceListCreateView.as_view(), name='resource-list-create'),
    path('resources/<int:pk>/',                 ResourceDetailView.as_view(),     name='resource-detail'),

    # ── Admin Stats ────────────────────────────────────────────────────────
    path('admin/stats/',                        AdminStatsView.as_view(),                name='admin-stats'),

    # ── Admin Settings ─────────────────────────────────────────────────────
    path('admin/settings/',                     AdminPlatformSettingsView.as_view(),     name='admin-settings'),
    path('admin/notification-settings/',        AdminNotificationSettingsView.as_view(), name='admin-notification-settings'),
    
    # ── Mentor Favorites ───────────────────────────────────────────────────
    path('favorites/',                          MentorFavoriteListView.as_view(),        name='favorite-list'),
    path('favorites/<int:mentor_id>/toggle/',   MentorFavoriteToggleView.as_view(),      name='favorite-toggle'),
    
    # ── Saved Searches ─────────────────────────────────────────────────────
    path('saved-searches/',                     SavedSearchListCreateView.as_view(),     name='saved-search-list-create'),
    path('saved-searches/<int:pk>/',            SavedSearchDetailView.as_view(),         name='saved-search-detail'),
    
    # ── Real-Time Messaging (Phase 3) ──────────────────────────────────────
    path('messages/',                           MessageListCreateView.as_view(),         name='message-list-create'),
    path('conversations/',                      ConversationListView.as_view(),          name='conversation-list'),
    path('messages/<int:pk>/read/',             MessageMarkAsReadView.as_view(),         name='message-mark-read'),
    path('messages/unread-count/',              UnreadMessageCountView.as_view(),        name='unread-count'),
    
    # ── Session Analytics (Phase 3) ────────────────────────────────────────
    path('analytics/sessions/<int:pk>/',        SessionAnalyticsDetailView.as_view(),    name='session-analytics-detail'),
    path('analytics/student/',                  StudentAnalyticsView.as_view(),          name='student-analytics'),
    path('analytics/mentor/',                   MentorAnalyticsView.as_view(),           name='mentor-analytics'),
]
