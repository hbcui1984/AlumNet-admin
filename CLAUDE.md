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

**重要：本项目复用 AlumNet 主项目（同级目录 `../AlumNet`）的 uniCloud 服务空间，不应在本项目下创建自定义云函数。**

- `alumni-admin-co` 云对象位于 **AlumNet 主项目**：`../AlumNet/uniCloud-alipay/cloudfunctions/alumni-admin-co/`
- 本项目 `uniCloud-alipay/cloudfunctions/` 下只保留 uni-admin 框架自带的云函数（uni-stat、uni-portal 等）
- 新增管理端云函数时，必须在 AlumNet 主项目中创建并部署
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

### Database & Data Model

**重要：校友相关数据全部存储在 `uni-id-users` 表中，不使用独立的 `alumni-verification` 或 `alumni-users` 集合。**

与 AlumNet 主项目保持一致的数据模型：
- 认证信息直接存在 `uni-id-users`：`alumniStatus`(0待审核/1已通过/2已拒绝)、`submitTime`、`realName`、`educations`、`alumniCardNo` 等
- 学校配置集合名为 `alumni-school-config`（非 `school-config`）
- 好友关系集合名为 `alumni-friends`（复数，非 `alumni-friend`）
- 审计日志集合为 `alumni-verify-logs`

Database schemas 统一在 AlumNet 主项目中管理，本项目只保留 uni-admin 框架自带的 schema。

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

## 敏感文件处理

### manifest.json 与 appid

`manifest.json` 中包含 appid 等敏感信息，**不应将含有真实 appid 的版本提交到 git**。

处理规则：
- git 提交时，`manifest.json` 中的 appid 必须清空（保持空字符串 `""`）
- GitHub 上必须保留一个 appid 为空的 `manifest.json`，否则项目无法编译运行
- 本地开发时填入真实 appid，但提交前需还原为空值
- 可在 `.gitignore` 中配合使用，或每次提交前手动检查该文件

## 开发铁律

### 1. 先查主项目，再写代码

本项目是 AlumNet 主项目的管理端，共享同一个服务空间和数据库。编写任何涉及数据库操作的代码前，必须先查看主项目 `../AlumNet/uniCloud-alipay/cloudfunctions/` 下已有云对象的实现，确认：
- 实际使用了哪些集合名（不要自己猜或自己起名）
- 数据存储在哪个集合、哪些字段里（不要凭空假设独立集合）
- 集合命名的准确拼写（单复数、前缀等）

### 2. 不要凭空创建集合

绝对不要假设存在某个集合然后直接使用。如果主项目没有这个集合的 schema 定义，也没有云函数在读写它，那它就不存在。所有集合以主项目 `../AlumNet/uniCloud-alipay/database/` 下的 schema 文件为准。

### 3. 云函数只放主项目

所有自定义云函数（包括管理端专用的）都必须放在 AlumNet 主项目下，本项目只保留 uni-admin 框架自带的。`package.json` 中 `uni-id-common` 的依赖路径要与主项目其他云对象一致：`file:../../../uni_modules/uni-id-common/uniCloud/cloudfunctions/common/uni-id-common`。
