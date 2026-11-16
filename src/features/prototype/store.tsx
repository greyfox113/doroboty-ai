import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import posthog from "posthog-js";
import { currentPerson, initialState, transition, type Action, type State } from "./model";
import { parseState, readState, saveState, type StoragePort } from "./storage";
function browserStorage(): StoragePort | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function useStore() {
  const [loaded] = useState(() => readState(browserStorage()));
  const [state, setState] = useState(loaded.state);
  const [issue, setIssue] = useState(loaded.issue);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(loaded.blocked);
  const latest = useRef(state);
  const identifiedPersonId = useRef<string | null>(null);

  const synchronizeIdentity = useCallback((previous: State, next: State) => {
    if (!posthog.__loaded) return;

    try {
      const previousPerson = currentPerson(previous);
      const nextPerson = currentPerson(next);
      if (previousPerson?.id !== nextPerson?.id && previousPerson) posthog.reset();
      if (nextPerson && identifiedPersonId.current !== nextPerson.id) {
        posthog.identify(nextPerson.id, {
          name: nextPerson.name,
          role: nextPerson.role,
          ...(nextPerson.companyId ? { company_id: nextPerson.companyId } : {}),
        });
        identifiedPersonId.current = nextPerson.id;
      }
      if (!nextPerson) identifiedPersonId.current = null;
    } catch {
      // Analytics must not interrupt the prototype's own state transitions.
    }
  }, []);

  function commit(next: State, replace = false) {
    latest.current = next;
    setState(next);
    setError("");
    if (blocked && !replace) return;
    try {
      saveState(browserStorage(), next);
      setIssue("");
      if (replace) setBlocked(false);
    } catch (e) {
      setIssue((e as Error).message);
      if (posthog.__loaded)
        posthog.logger.warn("prototype state persistence failed", { operation: "save_state" });
    }
  }
  function run(action: Action) {
    try {
      const next = transition(latest.current, action);
      synchronizeIdentity(latest.current, next);
      commit(next);
      return true;
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "Sprawdź poprawność i długość wprowadzonych danych.",
      );
      if (posthog.__loaded)
        posthog.logger.warn("prototype state transition rejected", { action_type: action.type });
      return false;
    }
  }
  function importState(raw: string) {
    try {
      const next = parseState(raw);
      synchronizeIdentity(latest.current, next);
      commit(next, true);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    synchronizeIdentity(initialState(), latest.current);
  }, [synchronizeIdentity]);
  return {
    state,
    issue,
    error,
    blocked,
    original: loaded.original,
    run,
    importState,
    clearError: () => setError(""),
    reset: () => {
      const next = initialState();
      synchronizeIdentity(latest.current, next);
      commit(next, true);
    },
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePrototype() {
  const store = useContext(Context);
  if (!store) throw new Error("PrototypeProvider is required");
  return store;
}
