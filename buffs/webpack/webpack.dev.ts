import { mergeWithRules } from 'webpack-merge';

import { cactbotChunks, cactbotHtmlChunksMap, cactbotModules } from './constants';
import generateConfig from './webpack.config';

// Add timerbar_test.html
const cactbotModulesOverride = {
  ...cactbotModules,
};

const cactbotHtmlChunksMapOverride = {
  ...cactbotHtmlChunksMap,
};

const baseConfig = generateConfig({
  cactbotModules: cactbotModulesOverride,
  cactbotChunks: cactbotChunks,
  cactbotHtmlChunksMap: cactbotHtmlChunksMapOverride,
});

const tsConfigOverride = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            declaration: true,
            declarationMap: true,
          },
        },
      },
    ],
  },
};

export default mergeWithRules({
  module: {
    rules: {
      test: 'match',
      options: 'replace',
    },
  },
})(baseConfig, {
  mode: 'development',
  devtool: 'source-map',
  ...tsConfigOverride,
});
