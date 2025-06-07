#!/usr/bin/env node
const { execSync } = require('child_process');
const readline = require('readline');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function listMergedBranches() {
  const raw = run('git branch -r --merged origin/main');
  return raw
    .split('\n')
    .map(b => b.trim())
    .filter(b => b && !b.includes('->'))
    .map(b => b.replace(/^origin\//, ''))
    .filter(b => b !== 'main' && b !== 'dev' && !b.startsWith('feat/') && !b.startsWith('exp/'));
}

function confirm(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const merged = listMergedBranches();

  if (merged.length === 0) {
    console.log('No merged branches found.');
    rl.close();
    return;
  }

  console.log('Merged branches eligible for deletion:\n');
  merged.forEach(b => console.log('  ' + b));
  console.log('');

  const deleted = [];
  for (const branch of merged) {
    if (await confirm(rl, `Delete remote branch ${branch}? (y/N) `)) {
      try {
        run(`git push origin --delete ${branch}`);
        deleted.push(branch);
        console.log(`Deleted remote ${branch}`);
      } catch (e) {
        console.error(`Failed to delete remote ${branch}:`, e.message);
      }
    } else {
      console.log(`Skipped ${branch}`);
    }

    if (await confirm(rl, `Delete local branch ${branch}? (y/N) `)) {
      try {
        run(`git branch -D ${branch}`);
        console.log(`Deleted local ${branch}`);
      } catch (e) {
        console.error(`Failed to delete local ${branch}:`, e.message);
      }
    }
    console.log('');
  }

  rl.close();

  if (deleted.length) {
    console.log('Removed remote branches:');
    deleted.forEach(b => console.log('  ' + b));
  } else {
    console.log('No remote branches were deleted.');
  }

  console.log('\nCurrent remote branches:');
  const final = run('git branch -r');
  console.log(final);
}

main();
