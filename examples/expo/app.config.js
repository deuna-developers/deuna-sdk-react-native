module.exports = ({ config }) => {
  if (process.env.USE_LOCAL_PODS === '1') {
    return {
      ...config,
      plugins: ['./plugins/withLocalPods', ...(config.plugins || [])],
    };
  }
  return config;
};
