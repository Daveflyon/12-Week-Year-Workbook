# 12 Week Year Workbook - Project TODO

## Core Features
- [x] User authentication with personal workbook data persistence
- [x] Vision and goal setting interface (1-3 SMART goals with lead/lag indicators)
- [x] 12-week plan creation with weekly tactics and targets
- [x] Weekly scorecard for tracking daily execution of lead indicators
- [x] Automatic execution score calculation (85% target threshold)
- [x] Performance block scheduler (Strategic, Buffer, Breakout blocks)
- [x] Weekly review and reflection journal with adjustments tracking
- [x] Mid-cycle review (Week 6) and final review (Week 13) workflows
- [x] Progress dashboard with execution score trends and goal completion status
- [x] Progress bar comparing user performance against others for motivation
- [x] Pre-cycle checklist to ensure readiness before starting a cycle

## Engagement Features
- [x] Quotes from the book throughout the experience
- [x] Daily in-context flashcards to reinforce habits
- [x] Time reminders for users to choose when to update content
- [x] Checklists for users to confirm completion % done or not

## Technical Setup
- [x] Database schema design and migration
- [x] Backend tRPC procedures for all features
- [x] Frontend pages and components
- [x] Elegant styling with dark theme
- [x] Unit tests for critical functionality

## New Features (Phase 2)
- [x] Onboarding intro/overview for new users
- [x] Email/push notification delivery for reminders
- [x] PDF export for scorecards and cycle reviews
- [x] Accountability partner sharing feature
- [x] WAM (Weekly Accountability Meeting) scheduling
- [x] Partner invitation system with sharing settings

## Bug Fixes
- [x] Fix vision.get query returning undefined instead of null
- [x] Add "Designed by Hiturn Media" to footer
- [x] Add Hiturn Media clickable link to footer
- [x] Add Hiturn Media logo to footer
- [x] Add Hiturn Media credit to dashboard sidebar footer
- [x] Fix reminder.get query returning undefined instead of null
- [x] Fix onboarding modal mobile responsiveness - Next button cut off on mobile

## Help System (Phase 3)
- [x] Add help button to access onboarding guide anytime
- [x] Create contextual help for each screen
- [x] Allow users to replay intro from help menu

## First-Visit Tooltips (Phase 4)
- [x] Create tooltip tour system component
- [x] Add tooltips to Dashboard page
- [x] Add tooltips to Goals page
- [x] Add tooltips to Scorecard page
- [x] Add tooltips to Performance Blocks page
- [x] Add tooltips to Weekly Review page
- [x] Store visited pages in localStorage to show tooltips only once
- [x] Convert all text to British English spelling


## Bug Fixes (Phase 5)
- [x] Fix accountability partner invite not working after email sent (now sends notification to owner)
- [x] Fix pre-cycle checklist checkboxes not clickable (was key mismatch between UI and DB)

## Performance Blocks Enhancement (Phase 6)
- [x] Add repeat pattern selector to Add Block dialog (Weekdays, All Days, Weekends, Custom)
- [x] Allow custom day selection with checkboxes
- [x] Create multiple blocks at once for selected days

## Bulk Operations Enhancement (Phase 7)
- [x] Performance Blocks: Add multi-day selection to Edit dialog
- [x] Performance Blocks: Add "Apply to all similar blocks" option
- [x] Scorecard: Add Quick Fill feature for bulk day selection
- [x] Scorecard: Add weekdays/weekends/all/custom fill patterns
- [x] Checklist: Add "Check All" / "Uncheck All" buttons
- [x] Checklist: Bulk update all items in parallel

## Calendar-Style Schedule (Phase 8)
- [x] Redesign Weekly Schedule to look like Google Calendar
- [x] Add time slots on the left axis (e.g., 05:00, 06:00, 07:00...)
- [x] Position blocks according to their actual start/end times
- [x] Make block height proportional to duration
- [x] Keep edit/delete functionality on blocks

## Smart Tooltip Tours (Phase 9)
- [x] Show help hints automatically only on first visit to each section
- [x] Store visited sections in localStorage to track first-visit state
- [x] Make tours optional after first visit - accessible via help button
- [x] Add "Start Interactive Tour" button in Help dialog for each page
- [x] TourProvider context for triggering tours from anywhere

## Bug Fix - Existing Users Cannot See Entries (Phase 10)
- [x] Investigated - data was in database, issue was cycle ordering
- [x] Added cycle selector dropdown to Dashboard header
- [x] Modified getCyclesByUser to prioritize cycles with goals first
- [x] Deleted 56 empty test cycles from database
- [x] Cycles with actual data now show first in the dropdown
- [x] Users can switch between cycles using the selector
- [x] Robert Beecham's cycle with goal "Achieve £20,000 Monthly Revenue" now accessible

## Bug Fix - David Cannot See Entries (Phase 11)
- [x] Investigated - David's real data was in cycle 60011 named "Stats Test Cycle"
- [x] Renamed cycle 60011 to "12-Week Cycle - Jan 2026"
- [x] Deleted 42 test cycles from David's account
- [x] David now has 1 cycle with goal "Achieve £20,000 Monthly Revenue" and 6 tactics
- [x] Data visibility restored successfully

## Robustness Improvements - Prevent Cycle Visibility Issues (Phase 12)
- [x] Better default cycle selection: prefer cycles with goals > active status > most recent
- [x] Add goal count to cycle list API response (CycleWithGoalCount type)
- [x] Show goal count badges in cycle selector dropdown ("X goals" badge)
- [x] Add "empty cycle" indicator in dropdown ("Empty" badge for cycles with 0 goals)
- [x] Update tests to clean up test data after running (afterAll cleanup in all test files)
- [x] Add integration test for cycle ordering with mixed empty/populated cycles

## Cycle Management Enhancements (Phase 13)
- [x] Add "Delete Cycle" button to remove unwanted empty cycles from UI
- [x] Add confirmation dialog before deleting a cycle
- [x] Add cycle archiving feature to hide completed cycles while preserving history
- [x] Add "Show/Hide Archived" filter in cycle dropdown
- [x] Add "Unarchive" option to restore archived cycles

## Data Export Feature (Phase 14)
- [x] Add export button in Settings page
- [x] Export cycle data as JSON (full data backup)
- [ ] Export cycle data as PDF (printable summary) - future enhancement
- [x] Include goals, tactics, scores, and reviews in export

## Settings Enhancements (Phase 15)
- [x] Add "Reset All Tours" button to clear tour history
- [x] Show confirmation before resetting tours
- [x] Add progress indicators showing sections explored vs total
- [x] Display exploration progress in Settings with badges

## Auto-Save Implementation (Phase 16)
- [x] Create reusable useAutoSave hook with debouncing (1000ms delay)
- [x] Create SaveStatusIndicator component showing "Saving...", "Saved ✓", "Error" states
- [x] Implement auto-save on Scorecard page (tactic entries)
- [x] Implement auto-save on Vision page (text fields)
- [x] Implement auto-save on Weekly Review page (text fields)
- [x] Implement auto-save on Cycle Review page (text fields)
- [x] Implement auto-save on Settings page (reminder preferences)
- [x] Add visual feedback indicators to all auto-save pages
- [x] Handle offline/error states gracefully with retry option

## Fix Export and Add PDF Export (Phase 17)
- [x] Fixed "Failed to export cycle data" error - tRPC input format was incorrect
- [x] Fixed all export buttons to use { json: { ... } } format
- [x] Replaced JSON export with PDF export in Settings
- [x] Created printable cycle summary with goals, tactics, scores, and reviews
- [x] Export PDF now works on Scorecard, Cycle Review, and Settings pages
