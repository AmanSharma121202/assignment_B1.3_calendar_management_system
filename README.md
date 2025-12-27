# Calendar Management System

A full-featured calendar web application built with Next.js 15, TypeScript, Prisma, and Tailwind CSS.
Supports user accounts, multiple calendars, recurring events, and browser notifications.

## Features

### 📅 Calendar Views
- **Weekly View**: Interactive grid layout showing the current week.
- **Current Time Indicator**: A dynamic red line showing the exact current time.
- **Navigation**: Easily switch between weeks.

### ✨ Event Management
- **Create Events**: Click any time slot to create an event with title, description, and time.
- **Edit & Delete**: Click an event to modify its details or delete it.
- **Drag & Drop**: Move events to different times or days simply by dragging them.
- **Conflict Detection**: Prevents creating overlapping events (in strict mode).
- **Recurring Events**: Support for Daily, Weekly, and Monthly repeated events.

### 👤 User Accounts & Security
- **Authentication**: Secure Signup and Login (Email/Password) powered by NextAuth.js.
- **Session Management**: Protected routes and API endpoints.
- **Data Privacy**: Users can only see and manage their own calendars and events.

### 📂 Multiple Calendars
- **Custom Calendars**: Create separate calendars (e.g., "Work", "Personal").
- **Visibility Toggles**: Show/hide events by toggling calendars in the sidebar.
- **Delete Protection**: Custom confirmation popup when deleting a calendar to prevent accidental data loss.
- **Color Coding**: Events are automatically color-coded for visual distinction.

### 🔔 Reminders & Notifications
- **Browser Notifications**: Get system alerts for upcoming events.
- **Customizable Timing**: Set reminders for 10m, 30m, 1h, or 1 day before the event.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (with Glassmorphism UI)
- **Database**: SQLite
- **ORM**: Prisma
- **Auth**: NextAuth.js

## Setup & Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   ```bash
   npx prisma db push
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access the App**
   Open [http://localhost:3000](http://localhost:3000)

## API Reference

### Events
- `GET /api/events?start=...&end=...`: Fetch events range.
- `POST /api/events`: Create new event.
- `PUT /api/events/[id]`: Update event.
- `DELETE /api/events/[id]`: Delete event.

### Calendars
- `GET /api/calendars`: List all user calendars.
- `POST /api/calendars`: Create a new calendar.
- `DELETE /api/calendars/[id]`: Delete a calendar.

## Usage Tips
- **Authentication**: You can use demo account to login with email: demo@gmail.com and password: demo@1234.
- **Drag & Drop**: You cannot drag recurring events (instances are locked to the rule). Edit the series instead.
- **Reminders**: You must allow browser notifications when prompted for the feature to work.

## Known Limitations
- **Strict Conflict Detection**: Overlapping events are currently blocked. Future versions could allow overlaps with visual stacking.
- **Recurring Event Dragging**: You cannot drag individual instances of a recurring series. You must edit the series via the modal.
- **Mobile View**: The complex weekly grid is optimized for desktop and may be difficult to use on small mobile screens.
- **Email Notifications**: Notifications are currently browser-only (popups). Email integration requires an external SMTP service.

## Future Improvements
- **Event Sharing**: Allow users to share calendars with specific people (Read/Write permissions).
- **Advanced Recurrence**: Support for complex rules like "Last Friday of the month" and handling exceptions (removing one instance from a series).
- **Search Functionality**: A search bar to quickly find events by title or description.
- **External Sync**: Import/Export with Google Calendar or Outlook (.ics support).
- **Drag & Drop Logic**: Enhanced logic to split recurring series on drop (e.g., "Edit this event only" vs "Edit all future events").
