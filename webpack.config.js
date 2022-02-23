const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const webpack = require('webpack');
const WebpackBar = require('webpackbar');
const ZipPlugin = require('zip-webpack-plugin');

const pkg = require('./package.json');
const htmlTemplatesPlugins = require('./webpack.html.config');
const publicAssetsPlugin = require('./webpack.public.config');

process.env.VERSION = pkg.version;
const { TARGET_BROWSER = 'chrome' } = process.env;

const MANIFEST = process.env.MANIFEST_VERSION === '3' ? 'manifest.json' : 'manifest.v2.json';

const DIST_PATH = path.join(__dirname, 'dist');
const PUBLIC_PATH = path.join(__dirname, 'public');

const OUTPUT_PATH = path.join(DIST_PATH, `${TARGET_BROWSER}_unpacked`);

const browserPackedExtensions = {
  opera: 'crx',
  firefox: 'xpi',
  default: 'zip'
};

const PACKED_EXTENSION = browserPackedExtensions[TARGET_BROWSER] || browserPackedExtensions.default;

const fileFormat = '[name].[hash][ext]';

module.exports = {
  mode: process.env.NODE_ENV,
  devtool: process.env.NODE_ENV === 'development' ? 'inline-source-map' : false,
  cache: {
    type: 'filesystem',
    allowCollectingMemory: true
  },
  entry: {
    confirm: './src/confirm.tsx',
    fullpage: './src/fullpage.tsx',
    options: './src/options.tsx',
    popup: './src/popup.tsx',
    background: './src/background.ts',
    contentScript: './src/contentScript.ts'
  },
  output: {
    pathinfo: false,
    path: OUTPUT_PATH,
    assetModuleFilename: `static/media/${fileFormat}`
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      lib: path.resolve(__dirname, 'src', 'lib'),
      app: path.resolve(__dirname, 'src', 'app')
    },
    fallback: {
      url: false,
      os: false,
      path: false,
      stream: false,
      crypto: false,
      http: false,
      https: false
    }
  },
  optimization: {
    minimizer: [
      `...`, // webpack@5 syntax to extend existing minimizers
      new CssMinimizerPlugin()
    ]
  },
  plugins: [
    new Dotenv(),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),

    new MiniCssExtractPlugin({
      filename: 'static/styles/[name].css',
      chunkFilename: 'static/styles/[name].chunk.css'
    }),
    new ForkTsCheckerWebpackPlugin(),
    ...htmlTemplatesPlugins(PUBLIC_PATH),

    publicAssetsPlugin(PUBLIC_PATH, OUTPUT_PATH, MANIFEST, TARGET_BROWSER),

    new WebpackBar({
      name: 'Signum XT Wallet',
      color: '#80caff'
    }),

    new ZipPlugin({
      path: DIST_PATH,
      extension: PACKED_EXTENSION,
      filename: TARGET_BROWSER
    })
  ],
  module: {
    rules: [
      {
        test: /\.(woff|woff2)$/i,
        type: 'asset/resource',
        generator: {
          filename: `static/fonts/${fileFormat}`
        }
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: `static/media/${fileFormat}`
        }
      },
      {
        test: /\.module\.css$/i,
        sideEffects: true,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                getLocalIdent: getCSSModuleLocalIdent
              }
            }
          },
          'postcss-loader'
        ]
      },
      {
        test: /\.css$/i,
        exclude: /\.module\.css$/i,
        sideEffects: true,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          'postcss-loader'
        ]
      },
      {
        test: /\.svg$/i,
        issuer: /\.tsx?$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              prettier: false,
              svgo: false,
              svgoConfig: {
                plugins: [{ removeViewBox: false }]
              },
              titleProp: true,
              ref: true
            }
          },
          {
            loader: 'file-loader',
            options: {
              name: 'static/media/[name].[hash].[ext]'
            }
          }
        ]
      },
      {
        test: /\.m?js$/i,
        exclude: /node_modules/,
        type: 'javascript/auto'
      },
      {
        test: /\.tsx?$/i,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            customize: require.resolve('babel-preset-react-app/webpack-overrides')
          }
        }
      }
    ]
  }
};
