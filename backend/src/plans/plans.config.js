/**
 * Plans Configuration & Capability Matrix
 * Architecture ready for future subscription monetization (Free, Pro, Team, Enterprise)
 */
const PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    features: {
      compilerRunsPerDay: 50,
      aiExplanationsPerDay: 20,
      maxProjects: 3,
      teamWorkspaces: false,
      cloudSync: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro Developer",
    priceMonthly: 12,
    priceAnnual: 120,
    features: {
      compilerRunsPerDay: -1, // unlimited
      aiExplanationsPerDay: -1, // unlimited
      maxProjects: 50,
      teamWorkspaces: false,
      cloudSync: true,
      prioritySupport: true,
    },
  },
  team: {
    id: "team",
    name: "Team",
    priceMonthly: 29,
    priceAnnual: 290,
    features: {
      compilerRunsPerDay: -1,
      aiExplanationsPerDay: -1,
      maxProjects: 500,
      teamWorkspaces: true,
      cloudSync: true,
      prioritySupport: true,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 99,
    priceAnnual: 990,
    features: {
      compilerRunsPerDay: -1,
      aiExplanationsPerDay: -1,
      maxProjects: -1,
      teamWorkspaces: true,
      cloudSync: true,
      prioritySupport: true,
      dedicatedServer: true,
    },
  },
};

module.exports = {
  PLANS,
  getPlan: (planId) => PLANS[planId] || PLANS.free,
};
