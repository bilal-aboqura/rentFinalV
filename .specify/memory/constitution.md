<!--
Sync Impact Report:
- Version change: [CONSTITUTION_VERSION] -> 1.0.0
- List of modified principles:
  * [PRINCIPLE_1_NAME] -> I. Clean and Modular Code
  * [PRINCIPLE_2_NAME] -> II. Strict TypeScript & Next.js App Router Best Practices
  * [PRINCIPLE_3_NAME] -> III. Secure Server-Side Operations & Supabase Integration
  * [PRINCIPLE_4_NAME] -> IV. Test-Driven Development (TDD) with Vitest
  * [PRINCIPLE_5_NAME] -> V. Responsive, Mobile-First Tailwind UI
- Added sections:
  * Technology Stack Constraints
  * Performance Standards & Quality Gates
- Removed sections: None
- Templates requiring updates:
  * .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: None
-->

# RentFinal Constitution

## Core Principles

### I. Clean and Modular Code
Prioritize highly modular, decoupled, and reusable code structure suitable for a production environment. Keep functions and components single-purpose, small, and well-structured. Avoid monolithic designs and duplicated logic to maintain a clean codebase.

### II. Strict TypeScript & Next.js App Router Best Practices
All code MUST be type-safe using strict TypeScript. Avoid using "any" or unsafe type assertions. Follow Next.js App Router conventions and best practices, including a clean separation of concerns between Server and Client Components, optimal data fetching strategies, and layout-based routing.

### III. Secure Server-Side Operations & Supabase Integration
All database interactions and server-side operations MUST run securely through Supabase. Define and strictly enforce Row Level Security (RLS) policies. Implement robust, explicit error handling for all server actions, API routes, and operations to prevent security leaks and ensure system resilience.

### IV. Test-Driven Development (TDD) with Vitest
Strictly enforce test-driven development (TDD) as a non-negotiable process. Write failing unit and integration tests using Vitest first, ensure they fail, and then implement the solution. Maintain high test coverage and execute tests continuously during development.

### V. Responsive, Mobile-First Tailwind UI
All user interfaces MUST be responsive, designed with a mobile-first philosophy, and styled strictly using Tailwind CSS. Follow consistent UI/UX design guidelines and avoid adding unauthorized external custom styles or architectural patterns.

## Technology Stack Constraints

Do not introduce unsupported external architectural patterns. The tech stack is strictly centered on Next.js App Router, TypeScript, Tailwind CSS, Supabase, and Vitest. Adding external state management or routing packages without approval is prohibited.

## Performance Standards & Quality Gates

Deliver high performance suitable for a production environment. All build artifacts must pass TypeScript type checks, ESLint rules, and the Vitest test suite. Optimize page load times, image rendering, and minimize client-side bundle sizes to ensure a fast, production-ready application.

## Governance

1. This Constitution is the primary authority for development standards in RentFinal.
2. Any proposed changes to these principles or tech stack must be submitted as a pull request amending this document.
3. All code reviews and CI checks must verify compliance with these principles. Use AGENTS.md to track the current active plan and project context.

**Version**: 1.0.0 | **Ratified**: 2026-06-23 | **Last Amended**: 2026-06-23
