/** Jest in ESM mode (the project is "type": "module"); run through `npm test`. */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  // Source files import siblings with a ".js" extension; map them back to the .ts files.
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/../tsconfig.spec.json', diagnostics: { ignoreCodes: [151002] } }],
  },
  collectCoverageFrom: [
    // Business logic only: services, guards, filter and interceptor.
    '**/*.service.ts',
    'common/guards/*.ts',
    'common/filters/*.ts',
    'common/interceptors/*.ts',
    '!database/**',
  ],
  coverageDirectory: '../coverage',
};
