const path = require("path");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV,
  entry: path.resolve("src/index.js"),
  output: {
    path: path.resolve(__dirname, "docs"),
    filename: "[name].bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.ttf$/,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ["html", "json"],
    }),
  ],
};
