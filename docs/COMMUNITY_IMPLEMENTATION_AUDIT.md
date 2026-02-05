# Community Feature – Full Implementation Audit

Comprehensive audit of the Community feature across frontend, backend, and database.

---

## 1. Feature Overview

Community is a **Premium-only** feature that includes:

- **Peers** – Find and connect with other learners (by target career, experience level)
- **Leaderboard** – Streak-based ranking (all-time, optional week/month)
- **Study groups** – Create, join, leave groups; one chat room per group
- **Group chat** – In-app chat for study group members
- **Badges** – Gamification (first_week, streak_7, streak_30, group_member, early_bird)
- **Top groups by streak** – Groups ranked by collective streak

---

## 2. Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `connections` | One-way follow/connect (user_id → target_user_id) |
| `study_groups` | Group metadata (name, description, target_career, experience_level, created_by) |
| `study_group_members` | Group membership (group_id, user_id, role: admin/member) |
| `chat_rooms` | One room per study group (study_group_id) |
| `chat_messages` | Messages (room_id, user_id, body) |
| `badges` | Badge definitions (id, name, description, criteria) |
| `user_badges` | Earned badges (user_id, badge_id, earned_at) |
| `study_streaks` | Cached streaks (user_id, current_streak, longest_streak) |
| `study_activity` | Activity log (week_complete, study_session) |

### Profile columns used by Community

- `profiles`: `target_career`, `experience_level`, `linkedin_url`, `job_title`, `display_name`, `avatar_url`

---

## 3. API Endpoints

### Backend (`supabase/functions/api/index.ts`)

| Endpoint | Method | Auth | Premium | Description |
|----------|--------|------|---------|-------------|
| `/api/community/peers` | GET | ✓ | ✓ | List peers; filter by target_career, experience_level |
| `/api/community/connections` | POST, DELETE | ✓ | ✓ | Connect/disconnect with a peer |
| `/api/community/leaderboard` | GET | ✓ | ✓ | Streak leaderboard; period=all\|week\|month, limit |
| `/api/community/groups` | GET, POST | ✓ | ✓ | List groups (filtered) or create group |
| `/api/community/groups/top-by-streak` | GET | ✓ | ✓ | Top groups by collective streak |
| `/api/community/groups/:id` | GET | ✓ | ✓ | Single group + members |
| `/api/community/groups/:id/join` | POST | ✓ | ✓ | Join group (awards group_member badge) |
| `/api/community/groups/:id/leave` | DELETE | ✓ | ✓ | Leave group |
| `/api/community/groups/:id/members` | GET | ✓ | ✓ | List group members |
| `/api/community/chat/room/:studyGroupId` | GET, POST | ✓ | ✓ | Get/create chat room for group |
| `/api/community/chat/room/:roomId/messages` | GET, POST | ✓ | ✓ | List/send messages |
| `/api/community/badges` | GET | ✓ | No | List all badges |
| `/api/community/me/badges` | GET | ✓ | No | User's earned badges |

### Frontend usage

| Feature | API calls |
|---------|-----------|
| Peers | GET `/api/community/peers?target_career=&experience_level=` |
| Connect/Disconnect | POST/DELETE `/api/community/connections` |
| Leaderboard | GET `/api/community/leaderboard?period=all&limit=20` |
| Study groups | GET `/api/community/groups`, POST `/api/community/groups` |
| Join/Leave | POST `/api/community/groups/:id/join`, DELETE `.../leave` |
| Top groups | GET `/api/community/groups/top-by-streak?limit=10` |
| Chat room | GET `/api/community/chat/room/:studyGroupId` |
| Chat messages | GET/POST `/api/community/chat/room/:roomId/messages` |
| Badges | GET `/api/community/me/badges` (via useUserBadges) |

---

## 4. Frontend Implementation

### Page: `src/pages/Community.tsx`

- **Layout:** Two-column grid (leaderboard | peers), then top groups, then study groups.
- **Premium gate:** Shows upgrade CTA if not Premium.
- **Peers:** Filter inputs (target career, experience level); Connect/Connected button; LinkedIn link.
- **Leaderboard:** Top 10 by streak; avatar, name, flame icon.
- **Top groups by streak:** Only groups with streak > 0.
- **Study groups:** Filter, Create group form (name, description, target_career, experience_level), Join/Leave, Chat button (members only).
- **Group chat:** Sheet with message list and input; messages keyed by user (own vs others).

### Hook: `src/hooks/useUserBadges.ts`

- Fetches `/api/community/me/badges` for the current user.

### Navigation

- Community link in sidebar and nav (`/community`).

---

## 5. Identified Gaps & Issues

### Security / Logic

1. **Chat messages authorization**
   - `community/chat/messages` does not verify that the user is a member of the room.
   - RLS may enforce this if the client uses anon key, but the Edge Function uses the service role and bypasses RLS.
   - **Recommendation:** Verify membership via `chat_rooms` + `study_group_members` before returning or inserting messages.

2. **Group members visibility**
   - RLS on `study_group_members` allows `USING (true)` for SELECT, so any user can see any group’s members.
   - Likely acceptable for “who’s in the group,” but worth confirming.

### Frontend

3. **Group members list**
   - `GET /api/community/groups/:id/members` exists but is not used in the UI.
   - **Option:** Add a “View members” action that shows the member list (e.g. modal/drawer).

4. **Chat real-time updates**
   - Messages are loaded via React Query with no polling or Supabase Realtime.
   - **Recommendation:** Add polling (e.g. refetchInterval) or Supabase Realtime subscription so new messages appear without manual refresh.

5. **Peer filters**
   - Filters are free-text; no dropdowns or validation against roadmap/profile options.
   - Peers API uses exact `.eq()` match; partial or case-insensitive search may improve discoverability.

6. **Create group – roadmap link**
   - Backend accepts `roadmap_id` when creating a group; the Create form does not expose this.
   - **Option:** Allow linking a group to the user’s active roadmap.

### Backend

7. **community/groups/members error message**
   - `if (!groupId || req.method !== "GET")` returns `{ error: "Group ID required" }` even when the real problem is wrong method.
   - **Recommendation:** Return 405 with a method-not-allowed message for non-GET.

8. **Group streak calculation**
   - `community/groups/top-by-streak` computes group streak as “all members studied on each day” (strict AND).
   - Alternative: “any member studied” (OR) would be more forgiving and might better match UX expectations.

### Data / UX

9. **Profiles for peers/leaderboard**
   - Peers and leaderboard depend on `profiles.target_career` and `profiles.experience_level`.
   - These may not be populated if users skip profile completion; peers/leaderboard can appear empty.
   - **Recommendation:** Backfill from roadmap wizard where possible; prompt users to complete profile.

10. **Badges displayed but not discoverable**
    - Badges appear on the Community page; there is no dedicated “badges” or “achievements” view.
    - **Option:** Add a badges/achievements section or modal describing how to earn each badge.

---

## 6. Feature Completeness Matrix

| Feature | Backend | Frontend | DB | Notes |
|---------|---------|----------|-----|-------|
| Peers list | ✓ | ✓ | ✓ | Filters work |
| Connect/Disconnect | ✓ | ✓ | ✓ | |
| Leaderboard | ✓ | ✓ | ✓ | period=all only in UI |
| Study groups CRUD | ✓ | ✓ | ✓ | Create, list, join, leave |
| Group chat | ✓ | ✓ | ✓ | No real-time |
| Top groups by streak | ✓ | ✓ | ✓ | |
| Badges | ✓ | ✓ | ✓ | Display only, no discovery |
| Group members list | ✓ | — | ✓ | API exists, UI does not use it |
| Group details (single) | ✓ | — | ✓ | API exists, UI uses list only |

---

## 7. Recommendations

### High priority

1. Add membership check to `community/chat/messages` (and optionally `community/chat/room` for GET).
2. Add chat refresh (polling or Realtime) for a better chat experience.

### Medium priority

3. Use or remove `GET /api/community/groups/:id/members`; if kept, add “View members” in the UI.
4. Fix `community/groups/members` to return 405 for non-GET instead of 400.
5. Improve peer discovery (e.g. partial/fuzzy matching, suggested filters).

### Low priority

6. Add `roadmap_id` to Create group form.
7. Add a badges/achievements view or help text.
8. Revisit group streak definition (AND vs OR) based on product goals.
