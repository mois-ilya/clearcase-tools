const execSync = require('child_process').execSync;
const fs = require('fs');

/**
 *      Checks if current version is the latest version in the tree
 *      So that check in will go without conflicts
 *      !!! May not work properly for multiple branches
 * */
const checkVersionTree = path => {
    try {
        path = path.replace(/\r\n/, '');
        const stdout = execSync(`cleartool lsvtree "${path}"`, { encoding: 'utf8' });
        let versions = stdout.split('\n');
        let lastVersion;
        do {
            lastVersion = versions.pop()
        }
        while (versions.length && !lastVersion);
        if (lastVersion.indexOf('\\main\\CHECKEDOUT') === -1) {
            console.error(`
                Last version: ${lastVersion}
                ${path} is not updated to the last version\n`
            )
        }
    } catch (e) {
        console.log(`                ${e.message.trim().split('\n').pop()}`)
    }
};

const files = fs.readFileSync('2_change-list.txt', {encoding: 'utf8'})
    .toString()
    .split('\n')
    .filter(x => x.trim() !== '');
files.forEach(checkVersionTree);
