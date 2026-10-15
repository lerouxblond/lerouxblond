// Génère tous les SVG du profil dans ../assets (dark + light).
// Usage : node tools/generate.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { textCells, textWidth, GLYPH_H } from './pixel-font.mjs'
import {
  FOX_SITTING, FOX_EYES_CLOSED, TAIL_FRAMES, TAIL_ANCHOR, FOX_SLEEPING, PAW,
} from './sprites.mjs'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets')
mkdirSync(OUT, { recursive: true })

// ─── Palette ──────────────────────────────────────────────────────────────
const FOX = { O: '#E8671C', D: '#B4440F', L: '#F59A4A', W: '#FFF4E6', P: '#2A1810', N: '#2A1810', E: '#2A1810' }

const THEMES = {
  dark: {
    fox: { ...FOX, K: '#3A2418' },
    sky: ['#0E0B09', '#120E0B', '#17110D', '#1E150F', '#2A1B12'],
    treesBack: '#1E1510', treesFront: '#130E0B', ground: '#0C0907',
    title: '#FFF4E6', titleShadow: '#B4440F', subtitle: '#F59A4A', term: '#C9A88E',
    bar: '#1A130F', barEdge: '#2E2018', barTitle: '#FFF4E6',
    trail: ['#3A2418', '#B4440F', '#E8671C', '#F59A4A', '#FFF4E6', '#9FB4C7'],
    paw: '#E8671C', footerText: '#C9A88E', snow: '#3A2A20',
  },
  light: {
    fox: { ...FOX, W: '#FFFFFF', K: '#3A2418' },
    sky: ['#FFF8F0', '#FFF0E0', '#FFE4C8', '#FCD3AA', '#F7BE8A'],
    treesBack: '#EDA56C', treesFront: '#D27237', ground: '#9C3A0D',
    title: '#3A2418', titleShadow: '#E8671C', subtitle: '#B4440F', term: '#7A4A30',
    bar: '#FBE9D6', barEdge: '#F2D2B0', barTitle: '#3A2418',
    trail: ['#F2D2B0', '#F59A4A', '#E8671C', '#B4440F', '#3A2418', '#FFFFFF'],
    paw: '#E8671C', footerText: '#7A4A30', snow: '#F2D2B0',
  },
}

// ─── Utilitaires ──────────────────────────────────────────────────────────
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const r1 = (n) => Math.round(n * 100) / 100

/** Cellules [col,row] → un <path> avec fusion des séries horizontales. */
function cellsPath(cells, x, y, s, fill, attrs = '') {
  if (!cells.length) return ''
  const rows = new Map()
  for (const [c, r] of cells) (rows.get(r) ?? rows.set(r, []).get(r)).push(c)
  let d = ''
  for (const [r, cols] of [...rows].sort((a, b) => a[0] - b[0])) {
    cols.sort((a, b) => a - b)
    let start = cols[0], prev = cols[0]
    const flush = () => { d += `M${x + start * s} ${y + r * s}h${(prev - start + 1) * s}v${s}h${-(prev - start + 1) * s}z` }
    for (const c of cols.slice(1)) {
      if (c === prev + 1) { prev = c; continue }
      flush(); start = prev = c
    }
    flush()
  }
  return `<path${attrs} fill="${fill}" d="${d}"/>`
}

/** Sprite (grille de caractères) → un <path> par couleur. `only`/`skip` filtrent les rôles. */
function sprite(grid, colors, x, y, s, { only, skip = '' } = {}) {
  const byRole = {}
  grid.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.' || skip.includes(ch) || (only && !only.includes(ch))) return
    ;(byRole[ch] ??= []).push([c, r])
  }))
  return Object.entries(byRole).map(([role, cells]) => cellsPath(cells, x, y, s, colors[role])).join('')
}

const text = (str, x, y, s, fill, attrs = '') => cellsPath(textCells(str), x, y, s, fill, attrs)

/** Texte avec ombre portée pixel (décalée d'un pixel vers le bas). */
const shadowText = (str, x, y, s, fill, shadow) =>
  text(str, x, y + s, s, shadow) + text(str, x, y, s, fill)

/** Disque pixelisé de rayon `rad` cellules. */
function discCells(rad) {
  const cells = []
  for (let r = -rad; r <= rad; r++)
    for (let c = -rad; c <= rad; c++)
      if (c * c + r * r <= rad * rad + rad * 0.6) cells.push([c + rad, r + rad])
  return cells
}

const svg = (w, h, title, body, css = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${title}">
<title>${title}</title>
<style>${css}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }</style>
${body}
</svg>
`

function save(name, content) {
  writeFileSync(join(OUT, name), content)
  console.log(`  ${name.padEnd(28)} ${(content.length / 1024).toFixed(1)} KB`)
}

/** Keyframes d'opacité visibles sur les plages [début,fin] (en %), invisibles ailleurs. */
function onOff(name, ranges) {
  const e = 0.01
  const stops = ['0%{opacity:0}']
  for (const [a, b] of ranges) {
    stops.push(`${r1(Math.max(a - e, 0))}%{opacity:0}`, `${a}%{opacity:1}`, `${b}%{opacity:1}`, `${r1(Math.min(b + e, 100))}%{opacity:0}`)
  }
  stops.push('100%{opacity:0}')
  return `@keyframes ${name}{${stops.join('')}}`
}

// ─── Scène : sapins ───────────────────────────────────────────────────────
function pine(col, baseRow, h) {
  // sapin en étages : largeur qui croît puis se resserre à chaque étage
  const cells = []
  const tiers = Math.max(2, Math.round(h / 5))
  const tierH = Math.ceil(h / tiers)
  for (let r = 0; r < h - 1; r++) {
    const tier = Math.floor(r / tierH)
    const inTier = r % tierH
    const half = Math.floor(1 + tier * 1.1 + inTier * 0.8)
    for (let c = -half; c <= half; c++) cells.push([col + c, baseRow - h + r])
  }
  cells.push([col, baseRow - 1], [col, baseRow])
  return cells
}

function forest(rand, s, groundRow, cols, heightAt) {
  const cells = []
  for (let col = 0; col < cols; col += 3 + Math.floor(rand() * 4)) {
    const h = Math.round(heightAt(col) * (0.7 + rand() * 0.5))
    if (h >= 4) cells.push(...pine(col, groundRow, h))
  }
  return cells
}

// ─── Bannière ─────────────────────────────────────────────────────────────
function banner(themeName) {
  const T = THEMES[themeName]
  const W = 1200, H = 300, s = 6
  const cols = W / s, groundRow = 46 // sol à y = 276
  const rand = rng(themeName === 'dark' ? 7 : 11)
  let body = '', css = ''

  body += `<defs><clipPath id="frame"><rect width="${W}" height="${H}" rx="14"/></clipPath></defs><g clip-path="url(#frame)">`

  // ciel en bandes avec une rangée de tramage entre chaque bande
  const band = H / T.sky.length
  T.sky.forEach((color, i) => {
    body += `<rect y="${i * band}" width="${W}" height="${band + 1}" fill="${color}"/>`
    if (i > 0) {
      const dither = []
      for (let c = 0; c < cols; c += 2) dither.push([c, 0])
      body += cellsPath(dither, 0, i * band - s, s, color)
    }
  })

  // astre : lune (nuit) ou soleil couchant (jour)
  const moonRad = 6
  const mx = 1050, my = 40
  body += cellsPath(discCells(moonRad + 2), mx - 2 * s, my - 2 * s, s, themeName === 'dark' ? '#241913' : '#FFE9D2')
  body += cellsPath(discCells(moonRad), mx, my, s, themeName === 'dark' ? '#FFF4E6' : '#FFFFFF')
  if (themeName === 'dark') body += cellsPath([[3, 4], [4, 4], [8, 7], [6, 9], [7, 9], [9, 3]], mx, my, s, '#EAD6BE')

  // étoiles (nuit) / feuilles qui tombent (jour)
  if (themeName === 'dark') {
    css += '@keyframes tw{0%,100%{opacity:1}50%{opacity:.15}}'
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(rand() * cols) * s, y = Math.floor(rand() * 26) * s
      if (x > 260 && x < 900 && y > 60) continue // pas d'étoile derrière le titre
      const size = rand() < 0.25 ? s : s / 2
      const fill = ['#FFF4E6', '#9FB4C7', '#F59A4A'][Math.floor(rand() * 3)]
      body += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" style="animation:tw ${r1(2 + rand() * 4)}s ${r1(-rand() * 5)}s infinite"/>`
    }
  } else {
    css += '@keyframes fall{0%{transform:translate(0,-20px)}25%{transform:translate(24px,70px)}50%{transform:translate(-6px,150px)}75%{transform:translate(20px,230px)}100%{transform:translate(0,320px)}}'
    for (let i = 0; i < 22; i++) {
      const x = Math.floor(rand() * (W - 40))
      const fill = ['#E8671C', '#B4440F', '#F59A4A'][Math.floor(rand() * 3)]
      const leaf = [[0, 0], [1, 0], [1, 1], [2, 1]]
      body += `<g style="animation:fall ${r1(8 + rand() * 6)}s linear ${r1(-rand() * 14)}s infinite">${cellsPath(leaf, x, 0, 4, fill)}</g>`
    }
  }

  // forêt : deux plans, haute sur les bords, basse sous le titre
  const edge = (col) => {
    const x = col * s
    if (x < 250) return 20
    if (x > 920) return 22
    return 5
  }
  body += cellsPath(forest(rand, s, groundRow, cols, (c) => edge(c) + 4), 0, 0, s, T.treesBack)
  body += cellsPath(forest(rand, s, groundRow, cols, (c) => edge(c) * 0.75), 0, 0, s, T.treesFront)
  body += `<rect y="${groundRow * s}" width="${W}" height="${H - groundRow * s}" fill="${T.ground}"/>`

  // lucioles (nuit)
  if (themeName === 'dark') {
    css += '@keyframes fly{0%{opacity:0;transform:translate(0,0)}20%{opacity:1}50%{transform:translate(14px,-26px)}80%{opacity:1}100%{opacity:0;transform:translate(-8px,-50px)}}'
    for (let i = 0; i < 14; i++) {
      const x = 20 + Math.floor(rand() * 1160), y = 200 + Math.floor(rand() * 70)
      body += `<g style="animation:fly ${r1(5 + rand() * 4)}s ease-in-out ${r1(-rand() * 8)}s infinite"><rect x="${x - 3}" y="${y - 3}" width="9" height="9" fill="#F59A4A" opacity=".25"/><rect x="${x}" y="${y}" width="3" height="3" fill="#FFD9A8"/></g>`
    }
  }

  // renard : queue animée (derrière), corps, yeux qui clignent
  const fx = 60, fy = groundRow * s - FOX_SITTING.length * s
  const [ax, ay] = TAIL_ANCHOR
  // cycle 3 s : A · B · A · C
  css += onOff('tA', [[0, 33], [50, 83]]) + onOff('tB', [[33.01, 49.99]]) + onOff('tC', [[83.01, 100]])
  css += '.tail{animation-duration:3s;animation-iteration-count:infinite;animation-timing-function:step-end}'
  ;['tA', 'tB', 'tC'].forEach((name, i) => {
    const opacity = i === 0 ? '' : ' opacity="0"'
    body += `<g class="tail" style="animation-name:${name}"${opacity}>${sprite(TAIL_FRAMES[i], T.fox, fx + ax * s, fy + ay * s, s)}</g>`
  })
  body += sprite(FOX_SITTING, T.fox, fx, fy, s, { skip: 'E' })
  css += '@keyframes blinkOpen{0%,93%{opacity:1}94%,97%{opacity:0}98%,100%{opacity:1}}'
  css += '@keyframes blinkShut{0%,93%{opacity:0}94%,97%{opacity:1}98%,100%{opacity:0}}'
  body += `<g style="animation:blinkOpen 5s infinite">${sprite(FOX_SITTING, T.fox, fx, fy, s, { only: 'E' })}</g>`
  body += `<g opacity="0" style="animation:blinkShut 5s infinite">${cellsPath(FOX_EYES_CLOSED, fx, fy, s, T.fox.E)}</g>`

  // texte
  const tx = 292
  body += shadowText('LEROUXBLOND', tx, 66, 9, T.title, T.titleShadow)
  body += text('GAME DEV / WEB DEV', tx, 152, 4, T.subtitle)

  // ligne de terminal tapée caractère par caractère, curseur qui suit
  const line = "> HELLO, I'M ETHAN"
  const ts = 3, ty = 200, adv = 6 * ts, n = line.length
  const appear = (i) => r1(6 + i * (30 / n))
  ;[...line].forEach((ch, i) => {
    if (ch === ' ') return
    css += onOff(`c${i}`, [[appear(i), 88]])
    body += `<g style="animation:c${i} 9s infinite">${text(ch, tx + i * adv, ty, ts, T.term)}</g>`
  })
  const curStops = ['0%{transform:translateX(' + -n * adv + 'px)}']
  for (let i = 0; i < n; i++) {
    curStops.push(`${r1(appear(i) - 0.01)}%{transform:translateX(${(i - n) * adv}px)}`, `${appear(i)}%{transform:translateX(${(i + 1 - n) * adv}px)}`)
  }
  curStops.push(`88%{transform:translateX(0)}`, `88.01%{transform:translateX(${-n * adv}px)}`, `100%{transform:translateX(${-n * adv}px)}`)
  css += `@keyframes cur{${curStops.join('')}}@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}`
  body += `<g style="animation:cur 9s infinite"><rect x="${tx + n * adv}" y="${ty}" width="${5 * ts}" height="${GLYPH_H * ts}" fill="${T.subtitle}" style="animation:blink 1s step-end infinite"/></g>`

  body += '</g>'
  return svg(W, H, 'lerouxblond — game dev / web dev', body, css)
}

// ─── Titre de section ─────────────────────────────────────────────────────
function section(themeName, label, seed) {
  const T = THEMES[themeName]
  const W = 1200, H = 84, s = 6
  const rand = rng(seed)
  let css = '@keyframes tw{0%,100%{opacity:1}50%{opacity:.2}}'
  let body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="${T.bar}" stroke="${T.barEdge}"/>`
  body += sprite(PAW, { O: T.paw }, 26, 26, 4)
  body += text(label, 84, 21, s, T.barTitle)

  // traînée de pixels : de plus en plus dense vers la droite
  const start = 84 + textWidth(label, s) + 48, end = W - 24
  for (let x = start; x < end; x += s) {
    const t = (x - start) / (end - start)
    for (let row = 0; row < 4; row++) {
      if (rand() > 0.15 + t * 0.7) continue
      const fill = T.trail[Math.min(T.trail.length - 1, Math.floor(rand() * (2 + t * 4)))]
      const twinkle = rand() < 0.12 ? ` style="animation:tw ${r1(1.5 + rand() * 3)}s ${r1(-rand() * 3)}s infinite"` : ''
      body += `<rect x="${x}" y="${30 + row * s}" width="${s}" height="${s}" fill="${fill}"${twinkle}/>`
    }
  }
  return svg(W, H, label, body, css)
}

// ─── Séparateur : pas de renard ───────────────────────────────────────────
function divider(themeName) {
  const T = THEMES[themeName]
  const W = 1200, H = 48, n = 16
  let body = ''
  const css = '@keyframes step{0%{opacity:0}4%{opacity:1}45%{opacity:1}65%,100%{opacity:0}}'
  for (let i = 0; i < n; i++) {
    const x = 40 + i * 72, y = i % 2 ? 6 : 26
    body += `<g opacity=".7" style="animation:step 6s ${r1(i * 0.32)}s infinite">${sprite(PAW, { O: T.paw }, x, y, 2)}</g>`
  }
  return svg(W, H, 'fox tracks', body, css)
}

// ─── Pied de page : renard endormi ────────────────────────────────────────
function footer(themeName) {
  const T = THEMES[themeName]
  const W = 1200, H = 170, s = 6
  const msg = 'THANKS FOR VISITING!', ms = 4
  const foxW = 21 * s, gap = 48
  const fx = Math.round((W - foxW - gap - textWidth(msg, ms)) / 2), fy = 70
  let body = ''

  // petit tapis de neige / feuilles sous le renard
  const mound = []
  for (let c = -2; c < 23; c++) mound.push([c, 0])
  for (let c = 1; c < 20; c++) mound.push([c, -1])
  body += cellsPath(mound, fx, fy + FOX_SLEEPING.length * s + s, s, T.snow)
  body += sprite(FOX_SLEEPING, { ...T.fox, E: T.fox.K }, fx, fy, s)

  // « z Z » qui s'envolent depuis la tête
  const css = '@keyframes zz{0%{opacity:0;transform:translate(0,0)}20%{opacity:1}100%{opacity:0;transform:translate(26px,-46px)}}'
  ;[['Z', 3, 0], ['Z', 4, 1.2], ['Z', 3, 2.4]].forEach(([ch, zs, delay]) => {
    body += `<g style="animation:zz 3.6s ease-out ${delay}s infinite" opacity="0">${text(ch, fx + 4 * s, fy - 10, zs, T.subtitle)}</g>`
  })

  body += text(msg, fx + foxW + gap, fy + 36, ms, T.footerText)
  return svg(W, H, 'thanks for visiting', body, css)
}

// ─── Sortie ───────────────────────────────────────────────────────────────
const SECTIONS = {
  about: 'WHO I AM',
  now: 'RIGHT NOW',
  stack: 'TECH STACK',
  projects: 'FEATURED PROJECTS',
  stats: 'CONTRIBUTIONS',
  contact: 'FIND ME',
}

for (const theme of Object.keys(THEMES)) {
  console.log(`[${theme}]`)
  save(`banner-${theme}.svg`, banner(theme))
  Object.entries(SECTIONS).forEach(([key, label], i) => save(`section-${key}-${theme}.svg`, section(theme, label, 100 + i)))
  save(`divider-${theme}.svg`, divider(theme))
  save(`footer-${theme}.svg`, footer(theme))
}
