# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AlumNet-admin is a management backend for AlumNet (a WeChat mini-program for alumni networks). Built on the uni-admin framework using uni-app and uniCloud serverless platform.

## Tech Stack

- **Frontend**: uni-app (Vue 3), uni-ui components, Vuex, vue-i18n
- **Backend**: uniCloud (serverless), MongoDB-compatible database
- **Authentication**: uni-id with role-based access control
- **Target Platforms**: H5, WeChat Mini-program, Alipay Mini-program, App (iOS/Android)

## Build & Development

This project uses **HBuilderX** (DCloud's IDE) for development and building. There are no npm scripts for building or testing.

- Open the project in HBuilderX
- Use HBuilderX's built-in run/build commands for different platforms
- H5 base path is `/admin/` with hash router mode

## Architecture

### Page Structure

Pages are organized by feature domain:
- `pages/alumni/` - Alumni-specific features (dashboard, user management, verification, school config)
- `pages/system/` - System management (menu, permission, role, user, app, tag, safety logs)
- `pages/uni-stat/` - Analytics pages

Each feature typically has `list/` and `detail/` subdirectories.

### Cloud Backend

Cloud functions are in `uniCloud-alipay/cloudfunctions/`:
- `alumni-admin-co/` - Main cloud object for alumni admin operations
- Cloud objects use `_before` hook for authentication verification
- Role-based authorization checks in cloud functions

### State Management

Vuex store in `store/`:
- `modules/app.js` - App state (theme, menu, routes)
- `modules/user.js` - User state
- `modules/error.js` - Error state

### Key Utilities

Located in `js_sdk/uni-admin/`:
- `request.js` - HTTP request wrapper with interceptors
- `permission.js` - Permission checking utilities
- `util.js` - General utilities

### Database Schemas

Schemas in `uniCloud-alipay/database/`:
- `uni-id-*` - Identity and access control tables
- `opendb-*` - Open database schemas (menus, apps, etc.)
- `school-config` - Alumni-specific school configuration

## Key Conventions

### Conditional Compilation

Use `#ifdef` and `#ifndef` directives for platform-specific code:
```js
// #ifdef H5
// H5-specific code
// #endif
```

### Naming

- Vue components: PascalCase
- Pages: kebab-case directories with index files
- Cloud objects: suffix with `-co`
- Database collections: kebab-case

### Internationalization

Translations in `i18n/` directory (en.json, zh-Hans.json, zh-Hant.json). Use `$t('key')` for translations.

## Configuration Files

- `admin.config.js` - Admin UI configuration (login path, navbar, themes)
- `pages.json` - Page routing and window layout
- `manifest.json` - App manifest and platform settings
