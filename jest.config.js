/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // The matching service sets real setTimeout handles (30s response timers)
  // that outlive the test suite. forceExit prevents Jest from hanging on them.
  forceExit: true,
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@errandhub/shared$": "<rootDir>/shared/index.ts",
    "^@/(.*)$": "<rootDir>/apps/frontend/$1",
  },
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      { tsconfig: { isolatedModules: true, jsx: "react-native", esModuleInterop: true } },
    ],
  },
};
