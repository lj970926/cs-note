import test, { describe } from "node:test"
import assert from "node:assert"
import { getCondition } from "./conditions"
import { QuartzComponentProps } from "../../components/types"
import { FullSlug } from "../../util/path"

function makeProps(slug: string): QuartzComponentProps {
  return {
    fileData: {
      slug: slug as FullSlug,
      frontmatter: {},
    },
  } as QuartzComponentProps
}

describe("built-in layout conditions", () => {
  test("index only matches the homepage", () => {
    const condition = getCondition("index")

    assert.ok(condition)
    assert.equal(condition(makeProps("index")), true)
    assert.equal(condition(makeProps("notes/example")), false)
  })

  test("not-index excludes the homepage", () => {
    const condition = getCondition("not-index")

    assert.ok(condition)
    assert.equal(condition(makeProps("index")), false)
    assert.equal(condition(makeProps("notes/example")), true)
  })
})
