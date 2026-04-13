import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const deleteToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const saveValue = async (key: string, value: string) => {
  await SecureStore.setItemAsync(key, value);
};

export const getValue = async (key: string) => {
  return await SecureStore.getItemAsync(key);
};
