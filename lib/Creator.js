const chalk = require('chalk')
const execa = require('execa')
const inquirer = require('inquirer')
const EventEmitter = require('events')
const loadRemotePreset = require('../lib/utils/loadRemotePreset')
const writeFileTree = require('../lib/utils/writeFileTree')
const copyFile = require('../lib/utils/copyFile')
const generateReadme = require('../lib/utils/generateReadme')
const { installDeps } = require('../lib/utils/installDeps')
const TEMPLATE_LIST = require('./constant');

const { hasPnpm3OrLater } = require('../lib/utils/common/env')

const {
  defaults
} = require('../lib/options')

const {
  log,
  error,
  hasYarn,
  hasGit,
  hasProjectGit,
  logWithSpinner,
  clearConsole,
  stopSpinner,
  exit,
  warn,
} = require('../lib/utils/common')

module.exports = class Creator extends EventEmitter {
  constructor(name, context) {
    super()

    this.name = name
    this.context = context

    this.run = this.run.bind(this)
  }

  async create(cliOptions = {}, preset = null) {
    const { run, name, context } = this


    // 选择模版
    const { action } = await inquirer.prompt([
      {
        name: 'action',
        type: 'list',
        message: `请选择模版：`,
        choices: TEMPLATE_LIST.map(item => {
          return {
            name: item.desc,
            value: item.type
          }
        })
      }
    ])

    // 获取配置
    const repo = TEMPLATE_LIST.filter(item => item.type === action)[0].repo;
    // 获取配置
    preset = await this.resolvePreset(repo);

    await clearConsole()
    log(chalk.blue.bold(`magic-cli CLI v${require('../package.json').version}`))
    logWithSpinner(`✨`, `正在创建项目 ${chalk.yellow(context)}.`)
    this.emit('creation', { event: 'creating' })

    stopSpinner()
    // 设置文件名，版本号等
    const { pkgVers, pkgDes, pkgName, author } = await inquirer.prompt([
      {
        name: 'pkgName',
        message: `请输入项目名称`,
        default: preset.targetDir.slice(preset.targetDir.lastIndexOf('/') + 1),
      },
      {
        name: 'pkgVers',
        message: `请输入项目版本号`,
        default: '1.0.0',
      },
      {
        name: 'pkgDes',
        message: `请输入项目简介`,
        default: 'ts + dvajs',
      },
      {
        name: 'author',
        message: `请输入作者`,
        default: 'zhyjor@163.com',
      }
    ])

    // 将下载的临时文件拷贝到项目中
    const pkgJson = await copyFile(preset.tmpdir, preset.targetDir)

    const pkg = Object.assign(pkgJson, {
      name: pkgName,
      version: pkgVers,
      description: pkgDes,
      author,
    })

    // write package.json
    log()
    logWithSpinner('📄', `生成 ${chalk.yellow('package.json')} 等模板文件`)
    await writeFileTree(context, {
      'package.json': JSON.stringify(pkg, null, 2)
    })

    // 包管理
    const packageManager = (
      (hasPnpm3OrLater() ? 'pnpm' : 'npm') ||
      (hasYarn() ? 'yarn' : null)
    )
    await writeFileTree(context, {
      'README.md': generateReadme(pkg, packageManager)
    })

    const shouldInitGit = this.shouldInitGit(cliOptions)
    if (shouldInitGit) {
      logWithSpinner(`🗃`, `初始化Git仓库`)
      this.emit('creation', { event: 'git-init' })
      await run('git init')
    }

    // 安装依赖
    stopSpinner()
    log()
    logWithSpinner(`⚙`, `安装依赖`)
    // log(`⚙  安装依赖中，请稍等...`)

    await installDeps(context, packageManager, cliOptions.registry)

    // commit initial state
    let gitCommitFailed = false
    if (shouldInitGit) {
      await run('git add -A')
      const msg = typeof cliOptions.git === 'string' ? cliOptions.git : 'init'
      try {
        await run('git', ['commit', '-m', msg])
      } catch (e) {
        gitCommitFailed = true
      }
    }

    // log instructions
    stopSpinner()
    log()
    log(`🎉  项目创建成功 ${chalk.yellow(name)}.`)
    if (!cliOptions.skipGetStarted) {
      log(
        `👉  请按如下命令，开始愉快开发吧！\n\n` +
        (this.context === process.cwd() ? `` : chalk.cyan(` ${chalk.gray('$')} cd ${name}\n`)) +
        chalk.cyan(` ${chalk.gray('$')} ${packageManager === 'yarn' ? 'yarn start' : packageManager === 'pnpm' ? 'pnpm run start' : 'npm start'}`)
      )
    }
    log()
    this.emit('creation', { event: 'done' })

    if (gitCommitFailed) {
      warn(
        `因您的git username或email配置不正确，无法为您初始化git commit，\n` +
        `请稍后自行git commit。\n`
      )
    }
  }

  async resolvePreset(repo) {
    let preset
    logWithSpinner(`Fetching remote repo config`)
    this.emit('creation', { event: 'fetch-remote-preset' })
    try {
      preset = await loadRemotePreset(repo, this.context)
      stopSpinner()
    } catch (e) {
      stopSpinner()
      error(`Failed fetching remote repo config`)
      throw e
    }

    if (!preset) {
      error(`preset not found.`)
      exit(1)
    }
    return preset
  }

  run(command, args) {
    if (!args) { [command, ...args] = command.split(/\s+/) }
    return execa(command, args, { cwd: this.context })
  }

  shouldInitGit(cliOptions) {
    if (!hasGit()) {
      return false
    }
    // --git
    if (cliOptions.forceGit) {
      return true
    }
    // --no-git
    if (cliOptions.git === false || cliOptions.git === 'false') {
      return false
    }
    // default: true unless already in a git repo
    return !hasProjectGit(this.context)
  }
}
