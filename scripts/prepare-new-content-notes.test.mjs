import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test, { describe } from "node:test"

import {
  extractBodyWikilinks,
  getFrontmatterUpdate,
  prepareNotes,
} from "./prepare-new-content-notes.mjs"

async function makeVault(files) {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "quartz-content-notes-"))

  for (const [filePath, contents] of Object.entries(files)) {
    const absolutePath = path.join(cwd, filePath)
    await fs.mkdir(path.dirname(absolutePath), { recursive: true })
    await fs.writeFile(absolutePath, contents, "utf8")
  }

  return cwd
}

describe("prepare-new-content-notes", () => {
  test("adds standard frontmatter when it is missing", async () => {
    const cwd = await makeVault({
      "content/New Note.md": "# New Note\n\nBody.\n",
    })

    const result = await prepareNotes({
      cwd,
      fix: true,
      paths: ["content/New Note.md"],
    })
    const updated = await fs.readFile(path.join(cwd, "content/New Note.md"), "utf8")

    assert.equal(result.errors.length, 0)
    assert.equal(result.warnings.length, 1)
    assert.match(
      updated,
      /^---\ntitle: New Note\naliases: \[\]\ntags: \[\]\ncreated: \d{4}-\d{2}-\d{2}\n---\n/,
    )
  })

  test("does not overwrite existing frontmatter fields", () => {
    const markdown = [
      "---",
      "title: Custom Title",
      "date: 2026-01-01",
      "---",
      "",
      "[[Target]]",
      "",
    ].join("\n")

    const result = getFrontmatterUpdate(
      markdown,
      "content/Original Name.md",
      new Date("2026-06-27"),
    )

    assert.equal(result.changed, true)
    assert.match(result.markdown, /title: Custom Title/)
    assert.match(result.markdown, /date: 2026-01-01/)
    assert.doesNotMatch(result.markdown, /title: Original Name/)
    assert.doesNotMatch(result.markdown, /created: 2026-06-27/)
    assert.match(result.markdown, /aliases: \[\]/)
    assert.match(result.markdown, /tags: \[\]/)
  })

  test("accepts a valid body wikilink", async () => {
    const cwd = await makeVault({
      "content/Target.md": "---\ntitle: Target\naliases: []\ntags: []\ncreated: 2026-06-27\n---\n",
      "content/Note.md":
        "---\ntitle: Note\naliases: []\ntags: []\ncreated: 2026-06-27\n---\n\nSee [[Target]].\n",
    })

    const result = await prepareNotes({
      cwd,
      fix: false,
      paths: ["content/Note.md"],
    })

    assert.deepEqual(result.errors, [])
    assert.deepEqual(result.warnings, [])
  })

  test("reports broken body wikilinks", async () => {
    const cwd = await makeVault({
      "content/Note.md":
        "---\ntitle: Note\naliases: []\ntags: []\ncreated: 2026-06-27\n---\n\nSee [[Missing Target]].\n",
    })

    const result = await prepareNotes({
      cwd,
      fix: false,
      paths: ["content/Note.md"],
    })

    assert.equal(result.errors.length, 1)
    assert.match(result.errors[0], /broken wikilink/)
  })

  test("warns but does not fail when a note has no body wikilink", async () => {
    const cwd = await makeVault({
      "content/Lone.md":
        "---\ntitle: Lone\naliases: []\ntags: []\ncreated: 2026-06-27\n---\n\nNo natural link yet.\n",
    })

    const result = await prepareNotes({
      cwd,
      fix: false,
      paths: ["content/Lone.md"],
    })

    assert.deepEqual(result.errors, [])
    assert.equal(result.warnings.length, 1)
  })

  test("ignores embeds and fenced code when extracting body wikilinks", () => {
    const markdown = [
      "---",
      "title: Note",
      "---",
      "",
      "![[Image.png]]",
      "```",
      "[[Inside Code]]",
      "```",
      "See [[Actual Target|label]].",
      "",
    ].join("\n")

    assert.deepEqual(extractBodyWikilinks(markdown), [
      { raw: "Actual Target|label", target: "Actual Target" },
    ])
  })

  test("does not process Excalidraw markdown files", async () => {
    const cwd = await makeVault({
      "content/Excalidraw/Drawing.excalidraw.md": "# Drawing\n",
    })

    const result = await prepareNotes({
      cwd,
      fix: true,
      paths: ["content/Excalidraw/Drawing.excalidraw.md"],
    })

    assert.deepEqual(result.checked, [])
  })
})
