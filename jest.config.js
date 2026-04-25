/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@errandhub/shared$": "<rootDir>/shared/index.ts",
    "^@/(.*)$": "<rootDir>/apps/frontend/$1",
  },
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      { isolatedModules: true, tsconfig: { jsx: "react-native" } },
    ],
  },
};
