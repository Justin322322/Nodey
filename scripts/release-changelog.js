#!/usr/bin/env node
/*
 Updates CHANGELOG.md by:
 1) Renaming the first "### [Unreleased]" section to "### [Released] - YYYY-MM-DD"
 2) Reinserting a fresh empty "### [Unreleased]" section right after the main "## Changelog" heading

 Usage:
   node scripts/release-changelog.js [--date=YYYY-MM-DD]

 Notes:
 - If no date is provided, today's date is used (local timezone).
 - Idempotent: if no Unreleased section is found, it exits without changes.
 */

const fs = require('fs')
const path = require('path')

function getArgValue(name) {
  const prefix = `--${name}=`
  const arg = process.argv.find((a) => a.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : undefined
}

function formatDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
if (!fs.existsSync(changelogPath)) {
  console.error('CHANGELOG.md not found at project root')
  process.exit(1)
}

const raw = fs.readFileSync(changelogPath, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'

const dateArg = getArgValue('date')
const today = dateArg ? dateArg : formatDate(new Date())

// 1) Replace first occurrence of Unreleased
const unreleasedHeadingRegex = /^### \[Unreleased\][^\S\r\n]*$/m
// Find Unreleased block and ensure it has content
const unreleasedBlockRegex = /^### \[Unreleased\][^\S\r\n]*\r?\n([\s\S]*?)(?=^###\s|\Z)/m
const blockMatch = unreleasedBlockRegex.exec(raw)
if (!blockMatch) {
  console.log('No "### [Unreleased]" section found. No changes made.')
  process.exit(0)
}
if (blockMatch[1].trim().length === 0) {
  console.log('"Unreleased" section is empty. Nothing to release.')
  process.exit(0)
}

let updated = raw.replace(unreleasedHeadingRegex, `### [Released] - ${today}`)

// 2) Ensure a new Unreleased section right after the main heading
// Find the first occurrence of "## Changelog" and insert after it if not already present at top
const mainHeadingRegex = /^## Changelog\s*$/m
const match = mainHeadingRegex.exec(updated)
if (match) {
  const insertPos = match.index + match[0].length
  // Only insert if no Unreleased heading exists now
  if (!unreleasedHeadingRegex.test(updated)) {
    const insertion = `${eol}${eol}### [Unreleased]${eol}`
    updated = updated.slice(0, insertPos) + insertion + updated.slice(insertPos)
  }
}

fs.writeFileSync(changelogPath, updated, 'utf8')
console.log('CHANGELOG.md updated: Unreleased -> Released and new Unreleased section added.')


