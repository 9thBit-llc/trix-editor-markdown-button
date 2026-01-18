const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env) => {
  const browser = env.browser || 'chrome';
  const isProduction = env.production === true;

  // Map browser target to manifest directory
  const manifestMap = {
    'chrome': 'chrome',
    'firefox': 'firefox',
    'firefox-v3': 'firefox-v3'
  };

  const manifestDir = manifestMap[browser] || 'chrome';

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'inline-source-map',
    entry: {
      'content/content-bundle': './src/content/main.js',
      'popup/popup': './src/popup/popup.js',
      'background/service-worker': './src/background/service-worker.js'
    },
    output: {
      path: path.resolve(__dirname, `dist/${browser}`),
      filename: '[name].js',
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }]
              ]
            }
          }
        }
      ]
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: `manifests/${manifestDir}/manifest.json`,
            to: 'manifest.json'
          },
          {
            from: 'src/popup/popup.html',
            to: 'popup/popup.html'
          },
          {
            from: 'src/popup/popup.css',
            to: 'popup/popup.css'
          },
          {
            from: 'src/styles/modal.css',
            to: 'styles/modal.css'
          },
          {
            from: 'src/content/page-context.js',
            to: 'content/page-context.js'
          },
          {
            from: 'icons',
            to: 'icons',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    resolve: {
      extensions: ['.js']
    }
  };
};
