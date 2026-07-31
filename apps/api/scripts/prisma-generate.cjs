const { spawnSync } = require('child_process');
const path = require('path');

const env = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://prisma:prisma@localhost:5432/prisma',
};

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['prisma', 'generate', '--schema', path.join(__dirname, '..', 'prisma', 'schema.prisma')],
  { stdio: 'inherit', env, cwd: path.join(__dirname, '..') },
);

if (result.status !== 0) {
  process.exit(result.status || 1);
}
