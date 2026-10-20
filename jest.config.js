module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/Test/Claude'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};
