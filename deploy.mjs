import { execSync } from 'child_process';

console.log('1. Building...');
execSync('npm run build', { stdio: 'inherit' });

console.log('2. Staging dist...');
execSync('git add -f dist', { stdio: 'inherit' });

const tree = execSync('git write-tree --prefix=dist').toString().trim();
console.log('Tree:', tree);

const commit = execSync(`git commit-tree ${tree} -m "Disconnect Google Sheets and Drive; transition 100% to Supabase database"`).toString().trim();
console.log('Commit:', commit);

console.log('3. Pushing to gh-pages...');
execSync(`git push origin ${commit}:refs/heads/gh-pages --force`, { stdio: 'inherit' });

console.log('4. Resetting index...');
execSync('git reset HEAD dist', { stdio: 'inherit' });

console.log('5. Triggering pages build...');
try {
  execSync('gh api -X POST repos/arman5252/ElectricalWorkTracker/pages/builds', { stdio: 'inherit' });
} catch (e) {
  console.log('Trigger result:', e.message);
}

console.log('Deploy completed successfully!');
