/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['/node_modules/(?!(ol|labelgun|mapbox-to-ol-style|ol-mapbox-style|geotiff)/).*/'],
  transform: {
    '^.+\\.js?$': require.resolve('babel-jest'),
  },
};
