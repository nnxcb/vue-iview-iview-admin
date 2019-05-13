const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const resolve = dir => {
  return path.join(__dirname, dir)
}

// 项目部署基础
// 默认情况下，我们假设你的应用将被部署在域的根目录下,
// 例如：https://www.my-app.com/
// 默认：'/'
// 如果您的应用程序部署在子路径中，则需要在这指定子路径
// 例如：https://www.foobar.com/my-app/
// 需要将它改为'/my-app/'
const BASE_URL = process.env.NODE_ENV === 'production'
  ? '/'
  : '/'

module.exports = {
  // Project deployment base
  // By default we assume your app will be deployed at the root of a domain,
  // e.g. https://www.my-app.com/
  // If your app is deployed at a sub-path, you will need to specify that
  // sub-path here. For example, if your app is deployed at
  // https://www.foobar.com/my-app/
  // then change this to '/my-app/'
  publicPath: BASE_URL,
  // tweak internal webpack configuration.
  // see https://github.com/vuejs/vue-cli/blob/dev/docs/webpack.md
  // 如果你不需要使用eslint，把lintOnSave设为false即可
  lintOnSave: true,
  chainWebpack: config => {
    config.resolve.alias
      .set('@', resolve('src')) // key,value自行定义，比如.set('@@', resolve('src/components'))
      .set('_c', resolve('src/components'))
      .set('_conf', resolve('config'))
  },
  configureWebpack: {
    // plugins: [
    //   new webpack.DefinePlugin({
    //     'process.version': '"0.12"'
    //   })
    // ]
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          include: /node_modules/,
          uglifyOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log'] // 移除console
            },
            output: {
              comments: false
            }
          },
          extractComments: true,
          parallel: true,
          cache: true
        })
      ],
      splitChunks: {
        chunks: 'async',
        minSize: 30000,
        maxSize: 250000
      }
    }
  },
  // 打包时不生成.map文件
  productionSourceMap: false,
  // 这里写你调用接口的基础路径，来解决跨域，如果设置了代理，那你本地开发环境的axios的baseUrl要写为 '' ，即空字符串
  devServer: {
    hot: true, // 开启热点
    inline: true, // 开启页面自动刷新
    compress: true, // 一切服务都启用gzip压缩
    progress: true, // 显示打包的进度
    useLocalIp: true, // 允许浏览器使用本地 IP 打开
    disableHostCheck: true, // 允许使用host配置访问
    host: 'localhost',
    port: 8888,
    // proxy: 'localhost:3000'
    // proxy: 'http://192.168.0.176:10081/'
    // proxy: 'http://localhost:9977/'
    proxy: 'http://localhost:8084'
  }
}
