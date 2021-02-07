const fsExtra = require('fs-extra')

module.exports = async function (repo, targetDir) {
  const os = require('os')
  const path = require('path')
  const tmpdir = path.join(os.tmpdir(), 'magic-cli')
  const fs = require('fs');

  const USER = 'xhzy-zhouyongjing';
  const PASS = '19921992';
  const git = require('simple-git/promise');
  const remote = `https://${USER}:${PASS}@${repo}`;

  await fsExtra.remove(tmpdir)

  if (!fs.existsSync(tmpdir)) {
    fs.mkdirSync(tmpdir);
  }

  await new Promise((resolve, reject) => {

    git().silent(false)
      .clone(remote, tmpdir)
      .then(() => resolve())
      .catch((err) => reject(err));
  })

  return {
    targetDir,
    tmpdir
  }
}
