import { findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import subscribeToFluxDispatcher from "../utils/subscribeToFluxDispatcher";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";

const UserStore = findByStoreName("UserStore");

if (!storage.decor_auth) {
  storage.decor_auth = { tokens: {} as Record<string, string> };
}

interface AuthorizationState {
  token: string | null;
  tokens: Record<string, string>;
  init: () => void;
  setToken: (token: string) => void;
  isAuthorized: () => boolean;
}

const listeners = new Set<() => void>();

const state: AuthorizationState = {
  token: null,
  tokens: storage.decor_auth.tokens ?? {},

  init() {
    const user = UserStore?.getCurrentUser?.();
    if (!user?.id) return;

    state.tokens = storage.decor_auth.tokens ?? {};
    state.token = state.tokens[user.id] ?? null;
    notify();
  },

  setToken(token: string) {
    const user = UserStore?.getCurrentUser?.();
    if (!user?.id) return;

    state.tokens = { ...state.tokens, [user.id]: token };
    storage.decor_auth.tokens = state.tokens;
    state.token = token;
    notify();
  },

  isAuthorized() {
    return !!state.token;
  },
};

function notify() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function useAuthorizationStoreHook(): AuthorizationState {
  const [, forceRender] = React.useState(0);

  React.useEffect(() => {
    const unsub = subscribe(() => forceRender((x) => x + 1));
    return unsub;
  }, []);

  return state;
}

type StoreHook = typeof useAuthorizationStoreHook & {
  getState: () => AuthorizationState;
  subscribe: (listener: () => void) => () => void;
};

const useAuthorizationStore = useAuthorizationStoreHook as StoreHook;
useAuthorizationStore.getState = () => state;
useAuthorizationStore.subscribe = subscribe;

state.init();

export const unsubscribe = subscribeToFluxDispatcher("CONNECTION_OPEN", () =>
  state.init(),
);

export { useAuthorizationStore };
