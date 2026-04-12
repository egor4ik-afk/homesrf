# Blueprint: Real Estate App

## Overview

This document outlines the project structure, design, and features of the Real Estate App. This application is designed to help users find and explore real estate properties.

## Project Structure

*   `/app`: Main directory for application routes.
    *   `/admin`: Admin panel.
    *   `/blog`: Blog section.
    *   `/catalog`: Property catalog.
    *   `/constructor`: Property constructor.
    *   `/crm`: CRM for agents.
    *   `/developers`: Information about developers.
    *   `/map`: Interactive map of properties.
    *   `layout.tsx`: Main application layout.
    *   `page.tsx`: Home page.
*   `/components`: Reusable components.
    *   `Header.tsx`: Application header.
    *   `Footer.tsx`: Application footer.
*   `/public`: Static assets (images, fonts, etc.).
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `next.config.js`: Next.js configuration.

## Design

*   **Framework:** Next.js with TypeScript.
*   **Styling:** Tailwind CSS.
*   **Layout:** Standard header-content-footer layout.
*   **Color Palette:** Primarily uses shades of gray, with blue as an accent color.
*   **Typography:** Clean, sans-serif fonts (Geist Sans).

## Features

*   **Home Page:**
    *   Hero section with a call-to-action.
    *   Featured properties section.
    *   "About Us" section.
*   **Navigation:**
    *   Header with links to main sections of the site.
*   **Property Catalog:**
    *   Separate pages for apartments and houses.
*   **Additional Sections:**
    *   Blog, map, developers, and property constructor pages (currently placeholders).

## Current Plan

*   The immediate goal is to create a visually appealing and functional home page to serve as the main entry point for the application. All other pages are currently placeholders and will be developed in future iterations.