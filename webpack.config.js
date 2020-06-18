const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');


module.exports = {
    entry: {
        main: [
            'core-js/stable',
            './docs/static/build.js',
        ]
    },
    mode: 'none',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './docs/build'),
        library: 'dataviz'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node-modules/,
            use: {
                loader: 'babel-loader',
            }
        }]
    },
};
