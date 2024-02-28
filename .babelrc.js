module.exports = (api) => {
  const isTest = api.env('test');

  api.cache(true);
  return {
    presets: [
      // Enabling Babel to understand TypeSFcript
      '@babel/preset-typescript',
      [
        // Allows smart transpilation according to target environments
        '@babel/preset-env',
        {
          // Specifying which browser versions you want to transpile down to
          targets: {
            browsers: ['last 2 versions'],
          },
          /**
           * Specifying what module type should the output be in.
           * For test cases, we transpile all the way down to commonjs since jest does not understand TypeScript.
           * For all other cases, we don't transform since we want Webpack to do that in order for it to do
           * dead code elimination (tree shaking) and intelligently select what all to add to the bundle.
           */
          modules: isTest ? 'commonjs' : false,
        },
      ],
    ],
  };
};
