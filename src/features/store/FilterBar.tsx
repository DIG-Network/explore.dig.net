// FilterBar — the store's search + category rail. Category chips are toggle buttons
// (aria-pressed); the search input is labeled; "clear filters" appears only when a filter is
// active. Controlled component: state lives in HomePage (which mirrors it into the URL).

import type { Category } from "@/catalog/types";
import type { CategoryFilter } from "@/catalog/catalog";
import { useT } from "@/i18n/useT";
import { categoryKey } from "./categoryKeys";

export interface FilterBarProps {
  categories: Category[];
  category: CategoryFilter;
  query: string;
  onCategoryChange: (category: CategoryFilter) => void;
  onQueryChange: (query: string) => void;
}

export function FilterBar({ categories, category, query, onCategoryChange, onQueryChange }: FilterBarProps) {
  const t = useT();
  const active = category !== "all" || query.trim() !== "";

  return (
    <div className="filter-bar">
      <label className="search-box">
        <span className="visually-hidden">{t("searchLabel")}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true" className="search-glyph">
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
        </svg>
        <input
          type="search"
          value={query}
          placeholder={t("searchPlaceholder")}
          onChange={(e) => onQueryChange(e.target.value)}
          data-testid="search-input"
        />
      </label>

      <div className="category-rail" role="group" aria-label={t("categoryFilterLabel")}>
        <button
          type="button"
          className="chip chip-toggle"
          aria-pressed={category === "all"}
          onClick={() => onCategoryChange("all")}
          data-testid="category-all"
        >
          {t("categoryAll")}
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className="chip chip-toggle"
            aria-pressed={category === c}
            onClick={() => onCategoryChange(c)}
            data-testid={`category-${c}`}
          >
            {t(categoryKey(c))}
          </button>
        ))}
        {active && (
          <button
            type="button"
            className="chip chip-clear"
            onClick={() => {
              onCategoryChange("all");
              onQueryChange("");
            }}
            data-testid="clear-filters"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>
    </div>
  );
}
