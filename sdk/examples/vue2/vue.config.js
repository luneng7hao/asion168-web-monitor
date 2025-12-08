const path = require('path');

module.exports = {
  configureWebpack: {
    resolve: {
      extensions: ['.js', '.vue', '.json', '.ts', '.tsx'],
      alias: {
        '@monitor': path.resolve(__dirname, '../../src'),
        '@': path.resolve(__dirname, 'src')
      },
      modules: [
        path.resolve(__dirname, '../../src'),
        'node_modules'
      ]
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              appendTsSuffixTo: [/\.vue$/],
              transpileOnly: true,
              compilerOptions: {
                module: 'esnext',
                target: 'es5',
                lib: ['es2015', 'dom'],
                allowJs: true,
                esModuleInterop: true,
                skipLibCheck: true
              }
            }
          }
        }
      ]
    }
  },
  chainWebpack: config => {
    // 确保 TypeScript 文件能被正确处理
    config.resolve.extensions
      .merge(['.ts', '.tsx', '.js', '.jsx', '.vue', '.json']);
  },
  devServer: {
    port: 5172,
    open: true
  }
};

