export const winterMode = {
  enabled: false,
  timezone: 'Europe/Kyiv',
  automaticPeriod: {
    start: { month: 12, day: 1 },
    end: { month: 1, day: 15 },
  },
  snowfall: {
    desktopParticles: 74,
    mobileParticles: 32,
  },
  sleigh: {
    firstFlightDelayMs: 1500,
    minIntervalMs: 55_000,
    maxIntervalMs: 100_000,
  },
} as const;
