// The cohort roster + starting baseline for the leaderboard.
// Identity (name/init/photo) is the display source of truth. The m/t/prev numbers
// are the live baseline; once an agent logs a week, their stored record overrides these.
// Photos are synced from Origin -> /assets/roster/<slug>.jpg (see memory: origin-agent-data-source).
export const SEED_MONTH = "2026-08";

export const ROSTER = [
  { name: "Aaron Rolfsrud",       init: "AR", m: { b: 6, s: 5, c: 2 }, t: { b: 28, s: 24, c: 14 }, prev: 3 },
  { name: "Alexa Neterer",        init: "AN", m: { b: 2, s: 1, c: 0 }, t: { b: 9,  s: 8,  c: 4 },  prev: 14 },
  { name: "Annessa Fackelman",    init: "AF", m: { b: 1, s: 1, c: 0 }, t: { b: 7,  s: 5,  c: 3 },  prev: 16 },
  { name: "Anton Louis Martinez", init: "AM", photo: "/assets/roster/anton-louis-martinez.jpg", m: { b: 1, s: 2, c: 1 }, t: { b: 8, s: 7, c: 4 }, prev: 15 },
  { name: "Antonio Mena",         init: "AM", m: { b: 3, s: 4, c: 2 }, t: { b: 20, s: 17, c: 10 }, prev: 9 },
  { name: "Bill Hill",            init: "BH", photo: "/assets/roster/bill-hill.jpg", m: { b: 3, s: 3, c: 1 }, t: { b: 16, s: 15, c: 8 }, prev: 11 },
  { name: "Danny Davis",          init: "DD", photo: "/assets/roster/danny-davis.jpg", m: { b: 0, s: 0, c: 0 }, t: { b: 2, s: 2, c: 1 }, prev: null },
  { name: "Diana Rolfsrud",       init: "DR", m: { b: 7, s: 5, c: 4 }, t: { b: 34, s: 28, c: 18 }, prev: 1 },
  { name: "KaLynn Okerstrom",     init: "KO", m: { b: 4, s: 4, c: 2 }, t: { b: 24, s: 20, c: 12 }, prev: 5 },
  { name: "Lauren Cottrill",      init: "LC", m: { b: 4, s: 2, c: 1 }, t: { b: 15, s: 13, c: 7 }, prev: 8 },
  { name: "Malcolm Wallaker",     init: "MW", m: { b: 2, s: 3, c: 0 }, t: { b: 12, s: 10, c: 5 }, prev: 10 },
  { name: "Maura Mena",           init: "MM", m: { b: 3, s: 2, c: 1 }, t: { b: 14, s: 11, c: 6 }, prev: 12 },
  { name: "Melissa Roberts",      init: "MR", photo: "/assets/roster/melissa-roberts.jpg", m: { b: 2, s: 2, c: 1 }, t: { b: 11, s: 9, c: 6 }, prev: 13 },
  { name: "Melissa Suddath",      init: "MS", m: { b: 5, s: 5, c: 3 }, t: { b: 26, s: 22, c: 16 }, prev: 6 },
  { name: "Morgan Leone",         init: "ML", m: { b: 6, s: 3, c: 2 }, t: { b: 22, s: 18, c: 11 }, prev: 4 },
  { name: "Nick Bock",            init: "NB", photo: "/assets/roster/nick-bock.jpg", m: { b: 8, s: 6, c: 3 }, t: { b: 30, s: 26, c: 15 }, prev: 2 },
  { name: "Sarah Brown",          init: "SB", photo: "/assets/roster/sarah-brown.jpg", m: { b: 5, s: 2, c: 1 }, t: { b: 19, s: 14, c: 9 }, prev: 7 },
  { name: "Sebastien Dixon",      init: "SD", photo: "/assets/roster/sebastien-dixon.jpg", m: { b: 1, s: 1, c: 0 }, t: { b: 5, s: 4, c: 2 }, prev: 18 },
  { name: "Tina Marie Fox",       init: "TF", photo: "/assets/roster/tina-marie-fox.jpg", m: { b: 1, s: 0, c: 0 }, t: { b: 4, s: 3, c: 2 }, prev: 17 },
];
