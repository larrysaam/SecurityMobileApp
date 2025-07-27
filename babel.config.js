module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        jsxRuntime: 'classic'
      }]
    ],
    plugins: [
      // Enable React Fast Refresh
      process.env.NODE_ENV !== 'production' && 'react-refresh/babel',
    ].filter(Boolean),
  };
};
