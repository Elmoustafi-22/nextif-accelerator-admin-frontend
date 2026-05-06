# NextIF Ambassador Admin Frontend

The Admin Portal for the NextIF Ambassador Platform. This application allows administrators to manage ambassadors, review task submissions, and oversee the platform's operations.

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Icons:** Lucide React

## Core Features

- **Ambassador Management:** Comprehensive tools for single and bulk onboarding (CSV).
- **Advanced Task Creation:** Create Weekly, Monthly, and **ADHOC** tasks with automated point assignment.
- **Enhanced Submission Review:**
  - Real-time review of ambassador submissions.
  - **Redo Workflow:** Request changes with specific feedback and custom deadlines.
  - Reviewer tracking to see which admin handled each submission.
  - Support for reviewing both manual and **AUTO-verified** tasks.
- **Event Management:**
  - Create and edit upcoming webinars, meetings, and workshops.
  - Track attendance with visual indicators (Present, Absent, Excused).
  - Bulk attendance marking for efficient operations.
- **Compliance & Monitoring:** Real-time visibility into ambassador activity and complaints.

- Node.js (v18 or higher recommended)
- npm

## Installation

1. Navigate to the project directory:

   ```bash
   cd nextif-ambassadors-admin-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To start the development server with hot reload:

```bash
npm run dev
```

The application will be available at usually `http://localhost:5173` (or the next available port).

## Building for Production

To build the application for production:

```bash
npm run build
```

This will generate the static assets in the `dist` directory.

## Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Linting

To run the linter:

```bash
npm run lint
```
