module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-react-jsx',
      // Enable React Fast Refresh
      process.env.NODE_ENV !== 'production' && 'react-refresh/babel',
    ].filter(Boolean),
  };
};
