const execSync = require('child_process').execSync;
const fs = require('fs');
const devLabel = process.argv[2];

function removeLabels() {
    console.log('Start removing...');
    const files = fs.readFileSync('9_migrated_files.txt', {encoding: 'utf8'})
        .toString()
        .split('\n')
        .filter(Boolean);

    files.forEach(file => {
        execSync(`cleartool rmlabel "${devLabel}" ${file}`);
    });
}

removeLabels();
