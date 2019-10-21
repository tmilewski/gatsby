import resolve from "./resolve"

exports.onCreateWebpackConfig = (
  { actions, stage, rules, plugins, loaders },
  {
    miniCssExtractOptions = {},
    cssLoaderOptions = {},
    postCssPlugins,
    useResolveUrlLoader,
    sassRuleTest,
    sassRuleModulesTest,
    ...sassOptions
  }
) => {
  const { setWebpackConfig } = actions
  const PRODUCTION = stage !== `develop`
  const isSSR = stage.includes(`html`)

  const sassLoader = {
    loader: resolve(`sass-loader`),
    options: {
      sourceMap: useResolveUrlLoader ? true : !PRODUCTION,
      ...sassOptions,
    },
  }

  const sassRule = {
    test: sassRuleTest || /\.s(a|c)ss$/,
    use: isSSR
      ? [loaders.null()]
      : [
          loaders.miniCssExtract(miniCssExtractOptions),
          loaders.css({ ...cssLoaderOptions, importLoaders: 2 }),
          loaders.postcss({ plugins: postCssPlugins }),
          sassLoader,
        ],
  }
  const sassRuleModules = {
    test: sassRuleModulesTest || /\.module\.s(a|c)ss$/,
    use: [
      !isSSR &&
        loaders.miniCssExtract({ ...miniCssExtractOptions, hmr: false }),
      loaders.css({ ...cssLoaderOptions, modules: true, importLoaders: 2 }),
      loaders.postcss({ plugins: postCssPlugins }),
      sassLoader,
    ].filter(Boolean),
  }
  if (useResolveUrlLoader && !isSSR) {
    sassRule.use.splice(-1, 0, {
      loader: `resolve-url-loader`,
      options: useResolveUrlLoader.options ? useResolveUrlLoader.options : {},
    })
    sassRuleModules.use.splice(-1, 0, {
      loader: `resolve-url-loader`,
      options: useResolveUrlLoader.options ? useResolveUrlLoader.options : {},
    })
  }

  let configRules = []

  switch (stage) {
    case `develop`:
    case `build-javascript`:
    case `build-html`:
    case `develop-html`:
      configRules = configRules.concat([
        {
          oneOf: [sassRuleModules, sassRule],
        },
      ])
      break
  }

  setWebpackConfig({
    module: {
      rules: configRules,
    },
  })
}
