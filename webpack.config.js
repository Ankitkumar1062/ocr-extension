const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/background.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
}; 