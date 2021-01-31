const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production'
const matchSVGSprite = /assets\/icons\/|components\/Base\/Icon\/icons\//;

module.exports = {
  entry: "./src/index.tsx",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "build")
  },

  // 生产模式下关闭map文件
  devtool: devMode ? "source-map" : "none",

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '$': path.resolve(__dirname, './typings'),
    },
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ["@babel/preset-env", {
                  modules: false,
                }],
                "@babel/preset-react",
              ],
              plugins: [
                ['@babel/plugin-transform-runtime', {
                  useESModules: true,
                }],
              ],
            },
          },
          {
            loader: 'ts-loader',
            options: {
              happyPackMode: true,
              transpileOnly: true,
              compilerOptions: {
                noEmit: false,
                module: 'esnext',
                target: devMode ? 'es2017' : 'es5',
              },
            },
          },
        ],
        exclude: [/node_modules/],
      },
      {
        test: /\.(css|less)$/,
        use: [
          devMode ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                mode: 'local',
                localIdentName: '[name]__[local]--[hash:base64:5]',
              },
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
          },
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                // modifyVars: {
                //   'primary-color': 'green',
                //   'menu-item-active-bg': 'green',
                // },
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: ['svg-inline-loader', 'raw-loader', 'file-loader']
      },
      {
        test: /\.(mp4|png|jpg|jpeg|png|svg|cur|gif|webp|webm|otf)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: 'static/[name].[hash:11].[ext]',
            },
          },
        ],
        exclude: matchSVGSprite,
      },
      {
        test: /\.svg$/,
        include: matchSVGSprite,
        use: [
          {
            loader: 'svg-sprite-loader',
            options: {
              symbolId: 'icon-[name]',
            },
          },
        ],
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      // template: path.resolve(__dirname, './public/index.html'),
      template: path.resolve(__dirname, './src/index.ejs'),
      minify: {
        removeComments: true, // 移除注释
        collapseWhitespace: true, // 移除空格
      }
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].css'
    }),
    new OptimizeCSSAssetsPlugin(),
  ],
  externals: {
    // "react": "React",
    // "react-dom": "ReactDOM"
  },
  devServer: {
    port: 9200,
    host: 'localhost',
    // open: true,
    disableHostCheck: true,
    historyApiFallback: true,
    // hot: true,
    compress: true,
    clientLogLevel: 'none',
    quiet: false,
    proxy: {
      // '/api': {
      //   target: 'http://localhost:3000',
      //   '^api': ''
      // }
    }
  }
};