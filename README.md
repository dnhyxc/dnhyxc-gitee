### If you would prefer to ignore this check, add SKIP_PREFLIGHT_CHECK=true to an .env file in your project.That will permanently disable this message but you might encounter other issues.

1，需要在 package.json 中配置使用 webpack 启动项目：

```json
"scripts": {
  "start": "webpack serve  --config ./config/webpack.common.js "
},
```

### Error: Cannot find module webpack-cli/bin/config-yargs

1，webpack-cli 升级到了 4，不能使用 webpack-dev-server 这个命令去启动了。需要使用如下配置进行启动：

```json
"scripts": {
  "start": "webpack serve  --config ./config/webpack.common.js "
},
```