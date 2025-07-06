// This file is intentionally kept to satisfy some build systems,
// but it does not export a component to avoid routing conflicts with src/app/page.tsx.
// A page.tsx cannot exist in a route group (app) if a page.tsx
// already exists at the root level. By removing the default export,
// Next.js will no longer treat this file as a page.
export {};
