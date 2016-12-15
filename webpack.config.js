var path = require('path');
var cp = require('child_process');

var SERVER_PATH = path.join(__dirname, './server/index');

function startServer() {
    server = cp.fork(SERVER_PATH);
    process.on('exit', () => server.kill('SIGTERM'));
}

module.exports = {
    devServer: {
        port: '3003',
        host: 'localhost',
        options: {
            publicPath: `http:\/\/localhost:3003/dist/`,
            hot: true,
            stats: {
                assets: false,
                colors: true,
                version: false,
                hash: false,
                timings: true,
                chunks: false,
                chunkModules: false
            }
        }
    },
    entry: './app/index.js',
    output: {
        path: path.join(__dirname, './dist'),
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    module: {
        loaders: [
            { test: /\.js|jsx$/, loaders: ['react-hot', 'babel'], exclude: /node_modules/ }
        ]
    },
    plugins: [startServer]
    
}