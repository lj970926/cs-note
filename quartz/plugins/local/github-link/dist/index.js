// src/components/styles/github-link.scss
var github_link_default =
  "a.github-link-icon {\n  display: flex;\n  align-items: center;\n  color: var(--darkgray);\n  transition: color 0.2s ease;\n  padding: 0.25rem;\n}\na.github-link-icon svg {\n  width: 1.2rem;\n  height: 1.2rem;\n}\na.github-link-icon:hover {\n  color: var(--dark);\n}"
var l
;((l = {
  __e: function (n2, l2, u3, t2) {
    for (var i2, r2, o2; (l2 = l2.__); )
      if ((i2 = l2.__c) && !i2.__)
        try {
          if (
            ((r2 = i2.constructor) &&
              null != r2.getDerivedStateFromError &&
              (i2.setState(r2.getDerivedStateFromError(n2)), (o2 = i2.__d)),
            null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), (o2 = i2.__d)),
            o2)
          )
            return (i2.__E = i2)
        } catch (l3) {
          n2 = l3
        }
    throw n2
  },
}),
  "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout,
  Math.random().toString(8))

// node_modules/preact/jsx-runtime/dist/jsxRuntime.mjs
var f2 = 0
function u2(e2, t2, n2, o2, i2, u3) {
  t2 || (t2 = {})
  var a2,
    c2,
    p2 = t2
  if ("ref" in p2) for (c2 in ((p2 = {}), t2)) "ref" == c2 ? (a2 = t2[c2]) : (p2[c2] = t2[c2])
  var l2 = {
    type: e2,
    props: p2,
    key: n2,
    ref: a2,
    __k: null,
    __: null,
    __b: 0,
    __e: null,
    __c: null,
    constructor: void 0,
    __v: --f2,
    __i: -1,
    __u: 0,
    __source: i2,
    __self: u3,
  }
  if ("function" == typeof e2 && (a2 = e2.defaultProps))
    for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2])
  return (l.vnode && l.vnode(l2), l2)
}

// src/components/GithubLink.tsx
var GithubLink = ({ displayClass, cfg }) => {
  return /* @__PURE__ */ u2("a", {
    class: displayClass,
    href: "https://github.com/lj970926",
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": "GitHub",
    children: /* @__PURE__ */ u2("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      width: "24",
      height: "24",
      fill: "currentColor",
      children: /* @__PURE__ */ u2("path", {
        d: "M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z",
      }),
    }),
  })
}
GithubLink.css = github_link_default
var GithubLink_default = (opts) => GithubLink

export { GithubLink_default as GithubLink }
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
