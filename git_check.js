import { execSync } from 'child_process';

try {
  console.log('--- GIT STATUS ---');
  console.log(execSync('git status', { encoding: 'utf8' }));
  
  console.log('--- GIT LOG ---');
  console.log(execSync('git log -n 5 --oneline', { encoding: 'utf8' }));
} catch (e) {
  console.error('Error running git:', e.message);
}
