import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

/** Persist the JWT to the OS keychain so it survives app restarts. */
export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

/** Read the JWT from the keychain; resolves to null when none is stored. */
export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

/** Remove the JWT from the keychain — called on logout / reset paths. */
export const deleteToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

/**
 * Generic string writer for arbitrary secure-store keys (theme preference,
 * onboarding flags). Use for non-token values that still benefit from the
 * keychain's at-rest encryption.
 */
export const saveValue = async (key: string, value: string) => {
  await SecureStore.setItemAsync(key, value);
};

/** Generic string reader counterpart to saveValue. */
export const getValue = async (key: string) => {
  return await SecureStore.getItemAsync(key);
};
