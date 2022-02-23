const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const htmlPluginOptions =
  process.env.NODE_ENV === 'production'
    ? {
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        }
      }
    : {};

const getTemplateEntry = (publicPath, name) => ({
  path: path.join(publicPath, `${name}.html`),
  chunks: [name]
});

module.exports = publicPath => {
  const htmlTemplates = [
    getTemplateEntry(publicPath, 'popup'),
    getTemplateEntry(publicPath, 'fullpage'),
    getTemplateEntry(publicPath, 'confirm'),
    getTemplateEntry(publicPath, 'options')
  ];

  return htmlTemplates.map(
    htmlTemplate =>
      new HtmlWebpackPlugin({
        template: htmlTemplate.path,
        filename: path.basename(htmlTemplate.path),
        chunks: [...htmlTemplate.chunks, 'commons'],
        inject: 'body',
        templateParameters: {
          process
        },
        ...htmlPluginOptions
      })
  );
};
