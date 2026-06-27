#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { pathToFileURL } from "node:url"
import YAML from "yaml"

const CONTENT_DIR = "content"
const IGNORED_CONTENT_PARTS = new Set([".obsidian", "templates", "private"])

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/")
}

function normalizeRepoPath(filePath, cwd = process.cwd()) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath)
  return toPosixPath(path.relative(cwd, absolute))
}

export function isContentMarkdownPath(filePath) {
  const normalized = toPosixPath(filePath)
  return normalized === `${CONTENT_DIR}.md` || normalized.startsWith(`${CONTENT_DIR}/`)
}

export function isIgnoredContentPath(filePath) {
  const normalized = toPosixPath(filePath)
  if (!isContentMarkdownPath(normalized)) {
    return true
  }

  if (!normalized.endsWith(".md") || normalized.endsWith(".excalidraw.md")) {
    return true
  }

  const parts = normalized.split("/")
  return parts.some((part) => IGNORED_CONTENT_PARTS.has(part))
}

function runGit(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

export function getDefaultNotePaths(cwd = process.cwd()) {
  const stagedAdded = runGit(
    ["diff", "--cached", "--name-only", "--diff-filter=A", "--", CONTENT_DIR],
    cwd,
  )
  const untracked = runGit(["ls-files", "--others", "--exclude-standard", "--", CONTENT_DIR], cwd)
  return [...new Set([...stagedAdded, ...untracked])].filter(
    (filePath) => !isIgnoredContentPath(filePath),
  )
}

export function parseMarkdownFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)
  if (!match) {
    return { frontmatter: null, body: markdown, fullMatch: "" }
  }

  return {
    frontmatter: match[1],
    body: markdown.slice(match[0].length),
    fullMatch: match[0],
  }
}

function yamlScalar(value) {
  return YAML.stringify(value).trim()
}

function markdownTitleFromPath(filePath) {
  return path.basename(filePath, ".md")
}

export function getFrontmatterUpdate(markdown, filePath, today = new Date()) {
  const created = today.toISOString().slice(0, 10)
  const parsed = parseMarkdownFrontmatter(markdown)
  const title = markdownTitleFromPath(filePath)

  if (parsed.frontmatter === null) {
    const frontmatter = [
      "---",
      `title: ${yamlScalar(title)}`,
      "aliases: []",
      "tags: []",
      `created: ${created}`,
      "---",
      "",
    ].join("\n")

    return {
      changed: true,
      missing: ["title", "aliases", "tags", "created"],
      markdown: `${frontmatter}${markdown}`,
      error: null,
    }
  }

  const doc = YAML.parseDocument(parsed.frontmatter)
  if (doc.errors.length > 0) {
    return {
      changed: false,
      missing: [],
      markdown,
      error: `Invalid YAML frontmatter: ${doc.errors[0].message}`,
    }
  }

  const missing = []
  const lines = []
  if (!doc.has("title")) {
    missing.push("title")
    lines.push(`title: ${yamlScalar(title)}`)
  }
  if (!doc.has("aliases") && !doc.has("alias")) {
    missing.push("aliases")
    lines.push("aliases: []")
  }
  if (!doc.has("tags") && !doc.has("tag")) {
    missing.push("tags")
    lines.push("tags: []")
  }
  if (!doc.has("created") && !doc.has("date")) {
    missing.push("created")
    lines.push(`created: ${created}`)
  }

  if (lines.length === 0) {
    return { changed: false, missing, markdown, error: null }
  }

  const frontmatterBody =
    parsed.frontmatter.trimEnd().length > 0
      ? `${parsed.frontmatter.trimEnd()}\n${lines.join("\n")}`
      : lines.join("\n")

  return {
    changed: true,
    missing,
    markdown: `---\n${frontmatterBody}\n---\n${parsed.body}`,
    error: null,
  }
}

function stripFencedCode(markdown) {
  return markdown.replace(/(^|\n)(```|~~~)[^\n]*\n[\s\S]*?(?:\n\2[ \t]*(?=\n|$)|$)/g, "\n")
}

function stripInlineCode(markdown) {
  return markdown.replace(/`[^`\n]*`/g, "")
}

export function extractBodyWikilinks(markdown) {
  const { body } = parseMarkdownFrontmatter(markdown)
  const searchable = stripInlineCode(stripFencedCode(body))
  const links = []
  const regex = /(^|[^!])\[\[([^\]\n]+)\]\]/g
  let match

  while ((match = regex.exec(searchable)) !== null) {
    const raw = match[2].trim()
    const target = raw.split("|")[0].split("#")[0].trim()
    if (target.length > 0) {
      links.push({ raw, target })
    }
  }

  return links
}

function removeMarkdownExtension(value) {
  return value.replace(/\.md$/i, "")
}

function normalizeTarget(value) {
  return removeMarkdownExtension(value)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^content\//i, "")
    .replace(/\/index$/i, "")
    .trim()
    .toLowerCase()
}

function targetKeys(value) {
  const normalized = normalizeTarget(value)
  return new Set([normalized, normalized.replace(/\s+/g, "-")].filter(Boolean))
}

function addTarget(knownTargets, value) {
  for (const key of targetKeys(value)) {
    knownTargets.add(key)
  }
}

function aliasesFromFrontmatter(markdown) {
  const parsed = parseMarkdownFrontmatter(markdown)
  if (parsed.frontmatter === null) {
    return []
  }

  const doc = YAML.parseDocument(parsed.frontmatter)
  if (doc.errors.length > 0) {
    return []
  }

  const aliases = []
  for (const key of ["aliases", "alias"]) {
    const value = doc.get(key, true)
    if (Array.isArray(value)) {
      aliases.push(...value.filter((alias) => typeof alias === "string"))
    } else if (typeof value === "string") {
      aliases.push(value)
    }
  }

  return aliases
}

async function walkMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkMarkdownFiles(fullPath)))
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath)
    }
  }

  return files
}

export async function buildKnownTargets(cwd = process.cwd()) {
  const contentRoot = path.join(cwd, CONTENT_DIR)
  const files = await walkMarkdownFiles(contentRoot)
  const knownTargets = new Set()

  for (const absolutePath of files) {
    const repoPath = normalizeRepoPath(absolutePath, cwd)
    const contentRelative = repoPath.replace(/^content\//, "")
    addTarget(knownTargets, contentRelative)
    addTarget(knownTargets, path.basename(contentRelative, ".md"))

    const markdown = await fs.readFile(absolutePath, "utf8")
    for (const alias of aliasesFromFrontmatter(markdown)) {
      addTarget(knownTargets, alias)
    }
  }

  return knownTargets
}

function isKnownTarget(target, knownTargets) {
  for (const key of targetKeys(target)) {
    if (knownTargets.has(key)) {
      return true
    }
  }
  return false
}

export function parseArgs(argv) {
  const args = [...argv]
  const paths = []
  let mode = "check"

  while (args.length > 0) {
    const arg = args.shift()
    if (arg === "--fix") {
      mode = "fix"
    } else if (arg === "--check") {
      mode = "check"
    } else if (arg === "--") {
      paths.push(...args)
      break
    } else if (arg?.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`)
    } else if (arg) {
      paths.push(arg)
    }
  }

  return { fix: mode === "fix", paths }
}

function formatList(items) {
  return items.map((item) => `  - ${item}`).join("\n")
}

export async function prepareNotes({ cwd = process.cwd(), fix = false, paths = [] } = {}) {
  const explicitPaths = paths.length > 0
  const selectedPaths = explicitPaths
    ? paths
        .map((filePath) => normalizeRepoPath(filePath, cwd))
        .filter((filePath) => !isIgnoredContentPath(filePath))
    : getDefaultNotePaths(cwd)

  const notePaths = []
  for (const filePath of selectedPaths) {
    const absolutePath = path.join(cwd, filePath)
    const stat = await fs.stat(absolutePath).catch(() => null)
    if (stat?.isFile()) {
      notePaths.push(filePath)
    }
  }

  const result = {
    checked: notePaths,
    fixed: [],
    warnings: [],
    errors: [],
  }

  if (notePaths.length === 0) {
    return result
  }

  const knownTargets = await buildKnownTargets(cwd)
  const today = new Date()

  for (const filePath of notePaths) {
    const absolutePath = path.join(cwd, filePath)
    const markdown = await fs.readFile(absolutePath, "utf8")
    const frontmatterUpdate = getFrontmatterUpdate(markdown, filePath, today)

    if (frontmatterUpdate.error) {
      result.errors.push(`${filePath}: ${frontmatterUpdate.error}`)
      continue
    }

    let nextMarkdown = markdown
    if (frontmatterUpdate.changed) {
      if (fix) {
        nextMarkdown = frontmatterUpdate.markdown
        await fs.writeFile(absolutePath, nextMarkdown, "utf8")
        result.fixed.push(`${filePath}: added ${frontmatterUpdate.missing.join(", ")}`)
      } else {
        result.errors.push(
          `${filePath}: missing ${frontmatterUpdate.missing.join(", ")} frontmatter`,
        )
      }
    }

    const links = extractBodyWikilinks(nextMarkdown)
    if (links.length === 0) {
      result.warnings.push(`${filePath}: no body wikilinks found`)
      continue
    }

    for (const link of links) {
      if (!isKnownTarget(link.target, knownTargets)) {
        result.errors.push(`${filePath}: broken wikilink [[${link.raw}]]`)
      }
    }
  }

  return result
}

async function main() {
  let options
  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
    return
  }

  const result = await prepareNotes(options)

  if (result.checked.length === 0) {
    console.log("No new content notes to prepare.")
    return
  }

  console.log(`Checked ${result.checked.length} new content note(s).`)
  if (result.fixed.length > 0) {
    console.log(`Fixed frontmatter:\n${formatList(result.fixed)}`)
  }
  if (result.warnings.length > 0) {
    console.warn(`Warnings:\n${formatList(result.warnings)}`)
  }
  if (result.errors.length > 0) {
    console.error(`Errors:\n${formatList(result.errors)}`)
    process.exitCode = 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
