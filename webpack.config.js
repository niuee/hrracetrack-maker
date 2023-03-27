const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = [
{
  mode: "development",
  entry: './src/backend/server.ts',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'dist/backend'),
  },
},
{
    mode: "development",
    entry: './src/frontend/index.tsx',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/page/index.html",
            filename: 'index.html',
            inject: 'body',
            path: path.resolve(__dirname, 'dist') // Output directory
        })
    ],
  }
];

