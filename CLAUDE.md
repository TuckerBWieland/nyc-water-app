# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Development server: `npm run dev`
- Production build: `npm run build`
- Preview build: `npm run preview`
- Lint code: `npm run lint`
- Format code: `npm run format`

## Code Style Guidelines
- Vue 3 Composition API with `<script setup>` syntax
- Use ES modules with named imports
- Component names: PascalCase (e.g., MapViewer)
- Variable/function names: camelCase
- Indentation: 2 spaces
- Quotes: single quotes for JavaScript/Vue
- Vue components: single-file components (.vue)
- CSS: Use Tailwind utility classes; custom CSS in scoped style blocks
- Async: Use async/await for asynchronous operations
- State management: Vue refs and reactive objects
- Error handling: Try/catch blocks for async operations

## Project Structure
- Components in src/components/
- Data fetched from public/data/
- Follow Vue 3 + Vite conventions