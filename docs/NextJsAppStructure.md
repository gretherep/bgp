# Next.js App Structure for Multimedia Catalog Application

## API Routes (src/app/api)

- /api/auth/
  - Handles Supabase authentication integration (login, logout, session)
- /api/media/
  - CRUD for media_items
  - GET list with filters (category, search)
  - POST create new media item (admin or authorized user)
  - PUT update media item
  - DELETE media item
- /api/categories/
  - CRUD for media_categories
- /api/comments/
  - CRUD for comments on media items
- /api/ratings/
  - POST and GET for ratings on media items
- /api/users/
  - Admin user management (role updates, listing)

## Middleware (src/middleware.ts)

- Auth middleware to protect API routes and page routes
- Checks Supabase session and user role
- Redirects unauthenticated users to login page
- Restricts admin routes to admin users only

## Frontend Pages and Components (src/app/)

- /(public)
  - Homepage, media catalog browse page
- /media/
  - Media detail page with comments and ratings
- /admin/
  - Admin dashboard with media management, user management, and analytics
- /auth/
  - Login and registration pages

## Utilities and Hooks (src/utils/ and src/hooks/)

- supabaseClient.ts
  - Supabase client singleton for use in API routes and frontend
- useAuth.ts
  - Custom React hook for authentication state and user info
- useMedia.ts, useComments.ts, useRatings.ts
  - Custom hooks for managing media and user interactions

## Styling

- Tailwind CSS classes used throughout components for responsive design

## Summary

This structure supports scalable and modular development of the multimedia catalog application in Next.js with clear separation of API routes, middleware, frontend pages, and utilities.
