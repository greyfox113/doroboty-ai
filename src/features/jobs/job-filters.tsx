import { useState } from "react";
import type { JobFilters } from "./types";
import {
  categoryLabels,
  contractLabels,
  functionLabels,
  remoteLabels,
  seniorityLabels,
} from "./presentation";
import { distanceOptions } from "./filters";
import { homeCities } from "./geo";

const categoryHelp = {
  build: "budujesz rozwiązania AI",
  apply: "stosujesz AI w pracy",
  lead: "prowadzisz inicjatywy AI",
} as const;

export function JobFiltersForm({
  filters,
  onChange,
  onReset,
}: {
  filters: JobFilters;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
}) {
  const [home, setHome] = useState(filters.home ?? "");
  const known = (value: string) =>
    homeCities.find(
      (city) => city.toLocaleLowerCase("pl") === value.trim().toLocaleLowerCase("pl"),
    );
  function commitHome(value: string) {
    const city = known(value);
    if (!value.trim()) onChange("home", "");
    else if (city && city !== filters.home) onChange("home", city);
  }
  return (
    <div className="dr-filters">
      <div className="dr-filters-head">
        <h2 className="ds-label">Filtry</h2>
        <button type="button" className="dr-text-button" onClick={onReset}>
          Wyczyść
        </button>
      </div>
      {(
        [
          ["category", "Kategoria", categoryLabels],
          ["remote", "Tryb pracy", remoteLabels],
          ["seniority", "Doświadczenie", seniorityLabels],
          ["contract", "Umowa", contractLabels],
          ["function", "Funkcja", functionLabels],
        ] as const
      ).map(([key, label, options]) => (
        <fieldset className="dr-filter-group" key={key}>
          <legend className="dr-f-label">{label}</legend>
          {Object.entries(options).map(([value, text]) => (
            <label className="dr-f-opt" key={value}>
              <input
                type="checkbox"
                checked={filters[key] === value}
                onChange={() => onChange(key, filters[key] === value ? "" : value)}
              />
              {text}
              {key === "category" && (
                <span className="ds-meta">{categoryHelp[value as keyof typeof categoryHelp]}</span>
              )}
            </label>
          ))}
        </fieldset>
      ))}
      <fieldset className="dr-filter-group">
        <legend className="dr-f-label">Odległość od domu</legend>
        <label className="dr-f-sub" htmlFor="filter-home">
          Gdzie mieszkasz
        </label>
        <input
          id="filter-home"
          className="dr-input"
          list="filter-home-list"
          placeholder="np. Pruszków"
          autoComplete="address-level2"
          aria-describedby="filter-home-hint"
          value={home}
          onChange={(e) => {
            setHome(e.target.value);
            if (known(e.target.value) || !e.target.value) commitHome(e.target.value);
          }}
          onBlur={() => commitHome(home)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitHome(home);
            }
          }}
        />
        <datalist id="filter-home-list">
          {homeCities.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
        <label className="dr-f-sub" htmlFor="filter-distance">
          Maksymalnie
        </label>
        <select
          id="filter-distance"
          className="dr-input"
          value={filters.distance ?? ""}
          onChange={(e) => onChange("distance", e.target.value)}
        >
          <option value="">Dowolna odległość</option>
          {distanceOptions.map((km) => (
            <option key={km} value={km}>
              do {km} km
            </option>
          ))}
        </select>
        <label className="dr-f-opt">
          <input
            type="checkbox"
            checked={filters.remoteToo !== false}
            onChange={() => onChange("remoteToo", filters.remoteToo === false ? "" : "0")}
          />
          Pokaż też pracę zdalną
        </label>
        <p className="ds-meta" id="filter-home-hint">
          {home && !known(home)
            ? "Wybierz miejscowość z listy podpowiedzi."
            : "Miejscowość zostaje tylko w adresie strony. Odległość liczymy w linii prostej do biura."}
        </p>
      </fieldset>
      <fieldset className="dr-filter-group">
        <legend className="dr-f-label">Relokacja</legend>
        <label className="dr-f-opt">
          <input
            type="checkbox"
            checked={Boolean(filters.relocation)}
            onChange={() => onChange("relocation", filters.relocation ? "" : "1")}
          />
          Z dodatkiem relokacyjnym
        </label>
      </fieldset>
    </div>
  );
}
