module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
  snapshotSerializers: ['@emotion/jest/serializer'],
  roots: ['<rootDir>'],
  testMatch: ['<rootDir>/**/**.test.{ts,tsx}'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  modulePaths: ['<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/setupTest.ts'],
  testURL: 'http://localhost',
  moduleNameMapper: {
    '\\.svg': '<rootDir>/testMocks.ts',
    '\\.(css|jpg|png)$': '<rootDir>/empty-module.js',
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
  moduleDirectories: ['node_modules', 'src'],
  notify: true,
  notifyMode: 'always',
  collectCoverageFrom: ['**/*.{ts,tsx}', '!<rootDir>/node_modules/'],
}
