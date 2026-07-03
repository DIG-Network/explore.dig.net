// categoryKeys — map the schema's category enum to localized message keys (SPEC categories are
// stable machine ids; their display names go through react-intl like all user copy).

import type { Category } from "@/catalog/types";
import type { MessageKey } from "@/i18n/messages/en";

const KEYS: Record<Category, MessageKey> = {
  payments: "categoryPayments",
  defi: "categoryDefi",
  nft: "categoryNft",
  gaming: "categoryGaming",
  social: "categorySocial",
  storage: "categoryStorage",
  identity: "categoryIdentity",
  infrastructure: "categoryInfrastructure",
  tools: "categoryTools",
  other: "categoryOther",
};

export function categoryKey(category: Category): MessageKey {
  return KEYS[category];
}
