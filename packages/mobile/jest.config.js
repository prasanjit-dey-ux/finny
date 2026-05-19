module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        jsx: "react-jsx",
        esModuleInterop: true,
        module: "commonjs",
        moduleResolution: "node",
        target: "ES2020",
        strict: false,
        skipLibCheck: true,
      },
    }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(expo-crypto)/)",
  ],
};
