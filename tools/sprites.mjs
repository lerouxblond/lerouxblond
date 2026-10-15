// Pixel sprites as character grids. Each letter maps to a palette role
// (see THEMES in generate.mjs); "." is transparent.
//   O roux  D roux foncé  L orange clair  W blanc crème  K contour
//   E yeux  N truffe  P chaussettes noires

// Renard assis, de face — 20 × 27.
export const FOX_SITTING = [
  '.KK..............KK.',
  '.KOK............KOK.',
  '.KOOK..........KOOK.',
  '.KOWOK........KOWOK.',
  '.KOWWOKKKKKKKKOWWOK.',
  '.KOOWOOLLLLLLOOWOOK.',
  'KOOOOOOLLLLLLOOOOOOK',
  'KOOOOOOOOOOOOOOOOOOK',
  'KOOOEEOOOOOOOOEEOOOK',
  'KOOOEEOOOOOOOOEEOOOK',
  'KWOOOOOOOOOOOOOOOOWK',
  'KWWOOOOOOOOOOOOOOWWK',
  '.KWWWWOOOOOOOOWWWWK.',
  '..KWWWWWOOOOWWWWWK..',
  '...KWWWWWNNWWWWWK...',
  '....KWWWWWWWWWWK....',
  '.....KKWWWWWWKK.....',
  '....KOOWWWWWWOOK....',
  '...KOOOWWWWWWOOOK...',
  '...KDOOWWWWWWOODK...',
  '..KDOOOWWWWWWOOODK..',
  '..KDOOOOWWWWOOOODK..',
  '..KDOOOOWWWWOOOODK..',
  '..KDOOOOOWWOOOOODK..',
  '..KDOOOPPOOPPOOODK..',
  '..KDOOOPPOOPPOOODK..',
  '..KKKKPPPKKPPPKKKK..',
]

// Paupières fermées : remplace les yeux pendant le clignement.
export const FOX_EYES_CLOSED = [
  // [col, row] des pixels de paupière
  [4, 9], [5, 9], [14, 9], [15, 9],
]

// Queue — 3 frames de 12 × 12, ancrées en (col 15, row 15) du renard.
export const TAIL_FRAMES = [
  [
    '......KK....',
    '.....KWWK...',
    '....KWWWWK..',
    '....KWWWWK..',
    '...KOOOOOK..',
    '...KOOOOOK..',
    '..KOOOOODK..',
    '..KOOOOODK..',
    '.KOOOOODK...',
    'KOOOOODK....',
    'KOOOODK.....',
    'KKKKKK......',
  ],
  [
    '.........KK.',
    '........KWWK',
    '.......KWWWK',
    '......KWWWK.',
    '.....KOOOOK.',
    '....KOOOOK..',
    '...KOOOODK..',
    '..KOOOODK...',
    '.KOOOOODK...',
    'KOOOOODK....',
    'KOOOODK.....',
    'KKKKKK......',
  ],
  [
    '....KK......',
    '...KWWK.....',
    '..KWWWWK....',
    '..KWWWWK....',
    '..KOOOOOK...',
    '..KOOOOOK...',
    '..KOOOOODK..',
    '...KOOOOODK.',
    '..KOOOOOODK.',
    'KOOOOOODK...',
    'KOOOODDK....',
    'KKKKKKK.....',
  ],
]
export const TAIL_ANCHOR = [15, 15]

// Renard endormi, enroulé, queue devant le museau.
export const FOX_SLEEPING = [
  '..K',
  '.KOK',
  '.KOOK.KKKKKKKKKK',
  'KOOOOKOOOOOOOOOOKK',
  'KOOOOOOOOOOOOOOOOOK',
  'KOEEOOOOOODOOOOOOOOK',
  'KWOOOOOOOODOOOOOOOOK',
  'KWWWOOOOOOODOOOOOOOOK',
  '.KKWWKKKKKKKKKKKOOOOK',
  '..KWWWWWOOOOOOOOKOOOK',
  '..KWWWWOOOOOOOOOOKOK',
  '...KKKKKKKKKKKKKKKK',
]

// Empreinte de patte — 9 × 8.
export const PAW = [
  '..OO.OO..',
  '..OO.OO..',
  'OO.....OO',
  'OO.OOO.OO',
  '..OOOOO..',
  '.OOOOOOO.',
  '.OOOOOOO.',
  '..OO.OO..',
]
