jest.mock("@/utils/secure-store", () => ({
  saveToken: jest.fn().mockResolvedValue(undefined),
  deleteToken: jest.fn().mockResolvedValue(undefined),
}));

import authReducer, {
  setCredentials,
  logout,
  updateUserState,
  loginUser,
  logoutUser,
  AuthState,
} from "../../../../apps/frontend/store/slices/auth-slice";
import { configureStore } from "@reduxjs/toolkit";
import { saveToken, deleteToken } from "@/utils/secure-store";

const mockUser = {
  userId: "user-1",
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@uni.ac.uk",
  avatarUrl: null,
  role: "requester" as const,
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

describe("auth slice — reducers", () => {
  it("returns the initial state", () => {
    expect(authReducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });

  it("setCredentials stores the user and token and sets isAuthenticated", () => {
    const state = authReducer(
      initialState,
      setCredentials({ user: mockUser, token: "tok123" }),
    );
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe("tok123");
    expect(state.isAuthenticated).toBe(true);
  });

  it("logout clears all auth state", () => {
    const loggedIn: AuthState = {
      user: mockUser,
      token: "tok123",
      isAuthenticated: true,
    };
    const state = authReducer(loggedIn, logout());
    expect(state).toEqual(initialState);
  });

  it("updateUserState merges partial user fields when a user is present", () => {
    const loggedIn: AuthState = {
      user: mockUser,
      token: "tok123",
      isAuthenticated: true,
    };
    const state = authReducer(
      loggedIn,
      updateUserState({ firstName: "Bob" }),
    );
    expect(state.user?.firstName).toBe("Bob");
    expect(state.user?.lastName).toBe("Smith");
  });

  it("updateUserState is a no-op when there is no user", () => {
    const state = authReducer(
      initialState,
      updateUserState({ firstName: "Bob" }),
    );
    expect(state.user).toBeNull();
  });
});

describe("auth slice — thunks", () => {
  const makeStore = () =>
    configureStore({ reducer: { auth: authReducer } });

  it("loginUser saves the token and dispatches setCredentials", async () => {
    const store = makeStore();
    await store.dispatch(
      loginUser({ user: mockUser, token: "tok-login" }) as any,
    );
    expect(deleteToken).toHaveBeenCalled();
    expect(saveToken).toHaveBeenCalledWith("tok-login");
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.token).toBe("tok-login");
  });

  it("logoutUser deletes the token and dispatches logout", async () => {
    const store = makeStore();
    // Seed a logged-in state first
    store.dispatch(setCredentials({ user: mockUser, token: "tok-login" }));
    await store.dispatch(logoutUser() as any);
    expect(deleteToken).toHaveBeenCalled();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();
  });
});
