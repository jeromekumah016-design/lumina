// Jest configuration for Lumina integration tests.
// Uses babel-jest with babel-preset-expo (already a transitive dep) to strip
// TypeScript and transpile source files.  The reanimated / nativewind plugins
// are intentionally omitted here — the test suite only exercises the pure
// service / state layer and does NOT render any React Native components.
module.exports = {
  testEnvironment: 'node',

  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'babel-jest',
      {
        // Inline babel config so the test runner never touches babel.config.js
        // (which includes the reanimated Babel plugin that crashes in Node).
        presets: [
          [
            'babel-preset-expo',
            {
              // Plain React JSX transform — no NativeWind JSX source needed
              jsxImportSource: 'react',
              // Disable the lazy-import transform so require() works normally
              lazyImports: false,
            },
          ],
        ],
        plugins: [],
      },
    ],
  },

  // Point @react-native-async-storage/async-storage at our in-memory mock so
  // the service can call getItem/setItem without any native bridge.
  moduleNameMapper: {
    '@react-native-async-storage/async-storage':
      '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
  },

  // Transpile Expo / React Native packages that ship ES-module syntax.
  transformIgnorePatterns: [
    'node_modules/(?!(expo-modules-core|expo-constants|expo-font|expo-linking|expo-router|expo|@expo|react-native|@react-native|@react-navigation|nativewind)/)',
  ],

  testMatch: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js'],
};
