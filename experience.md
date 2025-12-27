# Experience Report - Calendar Management System

## Approach
I approached this problem by prioritizing **correctness** of the data model and conflict logic before touching the UI.
1. **Backend First**: Defined the Schema (`Event`) and ensured the core conflict logic (`StartA < EndB && EndA > StartB`) was implemented in a service layer (`src/lib/events.ts`).
2. **Simple Stack**: Chose Next.js + SQLite to keep the app self-contained and easy to run without external DB containers.
3. **UI Composition**: Built a custom grid for the Weekly View to control the rendering of time slots and events, rather than using a heavy library, to demonstrate understanding of the domain.

## Challenges
- **Prisma Versioning**: Initially encountered issues with the latest Prisma 7.x (experimental/bleeding edge) which caused the build and client generation to fail. I resolved this by downgrading to the stable Prisma 5.x series.
- **Timezones**: Handling dates is always tricky. I utilized `date-fns` to reliably manipulate dates and focused on storing everything as full ISO strings (UTC) in the backend.

## AI Usage
I used AI to:
- For selecting the best tech stack for the project.
- Write the CSS grid logic, which can be tedious.
- Debug the build errors by identifying the configuration mismatch.

## Conclusion
The resulting system is a solid foundation. The "fail-fast" conflict detection ensures data integrity, and the React-based frontend provides a responsive experience.
