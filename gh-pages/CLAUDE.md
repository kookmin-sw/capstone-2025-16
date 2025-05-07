# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bento is a medical big data analysis system designed to explore and visualize rapidly increasing medical data quickly and efficiently, significantly improving research planning and execution speed. It's 950 times faster than Atlas (current industry standard) and allows users to create and analyze graphs based on custom statistical indicators, quickly deriving insights optimized for research purposes.

## Repository Purpose

This repository contains the GitHub Pages website for the Bento project (2025 Capstone Team 16). The pages.md file serves as the source for the project's landing page.

## Technical Stack

The actual application uses:

- **Frontend**: SvelteKit 5.0.0, TailwindCSS 3.4.17, D3.js 7.9.0, TypeScript, Vite 6.0.0
- **Backend API**: NestJS 11.0.1, ClickHouse client 1.11.1, Kysely 0.28.2
- **Cohort Query Service**: Express.js
- **AI**: Python with LangChain 0.3.21, OpenAI 1.65.5
- **Database**: ClickHouse

Note: This repository only contains the GitHub Pages content for project presentation, not the actual application code.

## Working with GitHub Pages

GitHub Pages automatically renders markdown files. When editing the pages.md file:

1. Format content using standard Markdown syntax
2. Remember that GitHub Pages will convert the .md file to HTML automatically
3. Image references need to be valid URLs or relative paths to images in the repository