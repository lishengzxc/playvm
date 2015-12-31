module.exports = {
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'playvm.js',
    library: "PlayVM",
    libraryTarget: "var"
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: {
        presets: ['es2015']
      }
    }]
  }
};