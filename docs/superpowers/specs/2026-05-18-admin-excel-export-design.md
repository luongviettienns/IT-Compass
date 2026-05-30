---
name: admin-excel-export-design
description: Specification for a professional admin Excel export modal and module-level export behavior for the IT Compass admin panel
metadata:
  type: project
---

# Admin Excel Export Design

## Context

The admin area manages operational data that is naturally reviewed, shared, and archived outside the app. For this project, Excel export is not just a convenience feature — it is part of the admin workflow for reporting, audit, offline review, and stakeholder sharing.

The goal is to make export feel like a **professional control**, not a one-off download button.

## Goal

Define a clean, consistent export UX for admin modules, including what each module should export and what the export form should look like.

## Recommended modules

### 1. Users

Why this module needs export:
- core identity and account management data
- useful for ops review, reporting, and bulk offline processing

Export fields:
- full name
- email
- role
- account status
- created date
- last login
- booking count
- notes or internal tag, if available

### 2. Mentors

Why this module needs export:
- mentor supply is a key business asset
- useful for quality review, availability analysis, and reporting

Export fields:
- full name
- email
- phone, if available
- expertise
- verification status
- hourly rate
- years of experience
- rating
- booking count
- review count
- active/inactive status
- updated date

### 3. Bookings

Why this module needs export:
- booking is the operational lifecycle of the platform
- useful for reconciliation, support, and scheduling review

Export fields:
- booking id
- student name
- mentor name
- booking type
- scheduled slot
- status
- price
- source
- notes
- created date
- updated date
- cancellation reason, if any

### 4. Assessments

Why this module needs export:
- assessment is a core product signal
- useful for product analytics and student guidance review

Export fields:
- user name
- submitted time
- result code
- top traits
- full score breakdown
- recommended majors
- recommended mentors
- completion time or duration, if available
- retry count, if available

### 5. Audit logs

Why this module needs export:
- audit data is often reviewed outside the app
- useful for compliance and traceability

Export fields:
- timestamp
- actor
- actor role
- action
- resource type
- resource id
- status
- IP address
- request id
- before/after summary, if policy allows

### 6. Blogs and comments

Why this module needs export:
- useful for content operations and moderation review
- lower priority than operational modules, but still valuable

Export fields for blogs:
- title
- slug
- author
- status
- tags
- views
- likes
- created date
- published date
- scheduled date, if any

Export fields for comments:
- commenter name
- post title
- content
- status
- created date
- hidden/deleted date
- moderation note, if available

## What should not be exported first

These are lower priority or not suitable for export early:
- settings pages
- small configuration surfaces
- any view with little operational data
- data that is not commonly reviewed outside the app

## Export UX requirements

### Entry point

Each export-enabled admin page should have a primary or secondary control labeled:
- `Export`
- or `Export Excel`

If the page already has filters or table actions, export should live beside them.

### Export modal

The export interaction should open a modal or popover with these sections:

#### 1) File format
- CSV
- XLSX

Recommended default: **XLSX**

#### 2) Scope
- current filtered view
- all results
- selected rows
- custom date range

#### 3) Columns
- checkbox list of available columns
- sensible defaults pre-selected
- allow deselecting non-critical fields

#### 4) Delivery options
- download immediately
- generate file and notify when ready, if dataset is large

#### 5) Naming
- editable filename prefix
- include date/time automatically
- consistent module naming

### Modal behavior

The modal should feel polished:
- clear title and short helper text
- summary of how many rows will export
- disabled state when no data is available
- loading state while generating
- success toast after download starts
- error state with plain language explanation

## Professional form characteristics

A good export form should:
- be scoped to the current filter state
- allow column selection
- show row count before export
- warn about large files
- use concise Vietnamese labels
- support a clear cancellation path
- avoid forcing unnecessary full exports

## Default export rules

Recommended defaults:
- format: XLSX
- scope: current filtered view
- columns: key business columns selected by default
- filename: `{module}-{yyyy-mm-dd-hhmm}`

## UX priorities by module

### Highest priority
1. Users
2. Mentors
3. Bookings
4. Assessments
5. Audit logs
6. Blogs/comments

### Why this order
- the first four are operational and high-value
- audit logs are critical for traceability
- content export is useful, but less urgent than operational data

## Success criteria

This design is successful when:
- admin users can export the data they are actively looking at
- exported files are useful without manual cleanup
- the export UI feels deliberate and professional
- each module exports the right business fields, not just every available field
- large data sets are handled gracefully
