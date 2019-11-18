const path = require('path');
const webpack = require('webpack');

module.exports = {
    target: "web",
    output: {
        path: __dirname + '/bundles',
        filename: 'pixi.dev.js'
    },
    entry: [
        "./packages/index.js"
    ],
    mode: "development",
    devtool: "inline-source-map",
    devServer: {
        contentBase: __dirname + '/bundles',
        watchContentBase: true,
        allowedHosts: ['test.ts'],
        host: '0.0.0.0',
        port: 80
    },
    module: {
        rules: [
            {
                test: /\.(png|svg|jpg|jpeg|gif|hdr)$/,
                use: [
                    'url-loader'
                ]
            },
            {
                test: /\.mp3$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        mimetype: 'audio/mpeg',
                    }
                }]
            },
            {
                test: /\.mp4$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        mimetype: 'video/mp4',
                    }
                }]
            },
            {
                test: /\.ogg$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        mimetype: 'video/ogg',
                    }
                }]
            },
            {
                test: /\.obj/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        mimetype: 'text/plain',
                    }
                }]
            },
            {
                test: /\.js$/,
                exclude: /(bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        /*compact: true,
                        minified: true,
                        comments: false,*/
                        presets: [
                            ['@babel/preset-env', {
                                loose: true
                            }]
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            //['@babel/plugin-transform-runtime', {absoluteRuntime: true}]
                        ]
                    }
                }
            },
            {
                test: /\.(fnt|txt|frag|vert)$/,
                use: [
                    'raw-loader'
                ]
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development')
        })
    ]
};
