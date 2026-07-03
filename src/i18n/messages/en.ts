// The BASE (English) message catalog — the single source of truth for message IDS + default text.
// Every other locale is a Partial of this shape; any key a locale omits falls back to English here
// (per-key fallback), so the store is always fully rendered even mid-translation.
//
// Brand/scheme literals (DIG Network, $DIG, Chia, explore.dig.net, dApp product names) are
// preserved verbatim in every locale (CLAUDE.md §6.3/§6.6).

export const en = {
  appName: "explore.dig.net",
  skipToContent: "Skip to content",
  headerTagline: "The DIG Network dApp store",
  submitCta: "List your dApp",
  themeToLight: "Switch to light theme",
  themeToDark: "Switch to dark theme",
  languageLabel: "Language",

  heroKicker: "Curated · reviewed · on-chain",
  heroTitleLead: "Apps that live",
  heroTitleAccent: "on chain.",
  heroIntro:
    "A curated shelf of decentralized apps built on the DIG Network and Chia. Every listing " +
    "settles on-chain and is reviewed before it ships here.",

  featuredHeading: "Featured",
  featuredIntro: "Hand-picked dApps worth opening first.",
  allAppsHeading: "All apps",
  appsCount: "{count, plural, one {# app} other {# apps}}",

  // Featured carousel (ARIA + controls). "carousel" / "slide" are aria-roledescriptions.
  carouselLabel: "Featured apps",
  carouselRoleDescription: "carousel",
  slideRoleDescription: "slide",
  carouselPrev: "Previous featured app",
  carouselNext: "Next featured app",
  carouselPause: "Pause auto-rotation",
  carouselPlay: "Resume auto-rotation",
  carouselSlideLabel: "{n} of {total}: {name}",
  carouselGoTo: "Show featured app {n}",

  searchLabel: "Search apps",
  searchPlaceholder: "Search by name, tag, or what it does…",
  categoryFilterLabel: "Filter by category",
  categoryAll: "All",
  categoryPayments: "Payments",
  categoryDefi: "DeFi",
  categoryNft: "NFTs",
  categoryGaming: "Gaming",
  categorySocial: "Social",
  categoryStorage: "Storage",
  categoryIdentity: "Identity",
  categoryInfrastructure: "Infrastructure",
  categoryTools: "Tools",
  categoryOther: "Other",
  clearFilters: "Clear filters",

  emptyHeading: "No apps match",
  emptyBody: "Try a different search, or clear the filters to see the whole shelf.",

  statusLive: "Live",
  statusBeta: "Beta",
  statusDraft: "Draft",
  featuredBadge: "Featured",

  openApp: "Open dApp",
  openAppNamed: "Open {name}",
  viewDetails: "View details",
  detailCtaHeading: "Ready to open {name}?",
  viewSource: "View source",
  backToStore: "Back to the store",
  aboutHeading: "About",
  screenshotsHeading: "Screenshots",
  detailsHeading: "Details",
  categoryLabel: "Category",
  tagsLabel: "Tags",
  chainLabel: "Chain",
  statusLabel: "Status",
  addedLabel: "Listed",
  authorLabel: "By",
  licenseLabel: "License",
  appVersionLabel: "App version",
  linksHeading: "Links",
  linkWebsite: "Website",
  linkDocs: "Docs",
  linkDiscord: "Discord",
  linkX: "X",
  linkYouTube: "YouTube",
  linkBlog: "Blog",
  placeholderNote:
    "Some artwork on this listing is a branded placeholder pending final art from the team.",

  notFoundHeading: "That app isn't on the shelf",
  notFoundBody:
    "The listing you're looking for doesn't exist (or was removed). Browse the store to see " +
    "everything that's live.",
  notFoundCta: "Browse all apps",

  iconAlt: "{name} icon",
  heroAlt: "{name} banner",
  screenshotDesktopAlt: "{name} — desktop screenshot {n}",
  screenshotMobileAlt: "{name} — mobile screenshot {n}",

  footerTagline: "Part of the DIG Network — a decentralized content and app layer on Chia.",
  footerSubmitLead: "Building on Chia?",
  footerSubmitLink: "Read the submission spec and list your dApp",
  footerCatalog: "Machine catalog (JSON)",
  footerDignet: "dig.net",
  footerDocs: "Docs",
  footerGitHub: "GitHub",
  footerDiscord: "Discord",
  versionLabel: "v{version}",
};

export type Messages = typeof en;
export type MessageKey = keyof Messages;
