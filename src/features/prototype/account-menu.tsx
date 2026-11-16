import { Menu } from "@base-ui/react/menu";
import { Link } from "react-router";
import { ChevronDown } from "lucide-react";
import type { Person } from "./model";

const items: Record<Person["role"], [string, string][]> = {
  candidate: [
    ["/app/profil", "Mój profil"],
    ["/app/aplikacje", "Moje aplikacje"],
    ["/app/zapisane", "Zapisane oferty"],
    ["/app", "Przegląd konta"],
  ],
  employer: [
    ["/app/kandydaci", "Panel firmy"],
    ["/app/oferty", "Moje ogłoszenia"],
    ["/app/organizacja", "Organizacja"],
    ["/app", "Przegląd konta"],
  ],
  operator: [["/app/case", "Materiały case study"]],
};

/** Signed-in account menu in the public header: personal pages live here, not in the main navigation. */
export function AccountMenu({ person }: { person: Person }) {
  return (
    <Menu.Root>
      <Menu.Trigger className="dr-account ph-no-capture" aria-label={`Menu konta: ${person.name}`}>
        <span className="dr-account-avatar" aria-hidden="true">
          {person.name[0]}
        </span>
        <span className="dr-account-name">{person.name}</span>
        <ChevronDown className="size-4" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="dr-account-positioner" align="end" sideOffset={6}>
          <Menu.Popup className="dr-account-popup ph-no-capture">
            <div className="dr-account-who" aria-hidden="true">
              <strong>{person.name}</strong>
              <span>{person.headline}</span>
            </div>
            {items[person.role].map(([to, label]) => (
              <Menu.LinkItem
                key={to}
                className="dr-account-item"
                closeOnClick
                render={<Link to={to} />}
              >
                {label}
              </Menu.LinkItem>
            ))}
            <Menu.Separator className="dr-account-sep" />
            <Menu.LinkItem
              className="dr-account-item"
              closeOnClick
              render={<Link to="/auth/sign-in" />}
            >
              Zmień osobę
            </Menu.LinkItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
