const { spawnSync } = require('child_process');

function run(command, args) {
  console.log(`\n[blizhe-build] $ ${command} ${args.join(' ')}\n`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log('[blizhe-build] version=0.3.0 starting vercel build');
run('npm', ['run', 'prisma:generate', '--workspace=@blizhe/api']);
run('npm', ['run', 'build', '--workspace=@blizhe/api']);
run('npm', ['run', 'build', '--workspace=@blizhe/web']);
console.log('[blizhe-build] finished ok');
