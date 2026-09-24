const { composePlugins, withNx } = require('@nx/webpack');

// Bundles the API for Node. The `@smartsoft001/*` and `@app/*` imports resolve
// through the workspace tsconfig paths and end up in the bundle; third-party
// packages stay external and are listed in the generated package.json.
module.exports = composePlugins(withNx({ target: 'node' }), (config) => {
  config.output = {
    ...config.output,
    ...(process.env.NODE_ENV !== 'production' && {
      clean: true,
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  };
  config.devtool = 'source-map';
  return config;
});
