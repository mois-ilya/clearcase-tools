const execSync = require('child_process').execSync;
const fs = require('fs');
const devLabel = process.argv[2];
const prodLabel = process.argv[3];
const execFiles = !process.argv.includes('--no-update');
const removeDuplicates = process.argv.includes('--rm-duplicates');

/* Get dev files*/
function execDevFiles() {
    console.log('Executing dev files...');
    execSync(`cleartool find -all -version "{lbtype_sub(${devLabel})}" -print > 9_migrated_files.txt`);
}

/**
 *      Checks if current version is the latest version in the tree
 *      So that check in will go without conflicts
 *      !!! May not work properly for multiple branches
 * */
function checkVersionTree(path, needMigrate, duplicates) {
    path = path.replace(/\r\n/, '');
    const stdout = execSync(`cleartool lsvtree "${path}"`, { encoding: 'utf8' });
    const versions = stdout.split('\n');
    versions.reverse().every(version => {
        const dev = version.includes(devLabel);
        const prod = version.includes(prodLabel);

        if (dev && prod) {
            console.error(' Two label ' + version);
            duplicates.push(path);
            return false;
        }
        if (dev) {
            // console.log(' Ok ' + version);
            return false;
        }

        if (prod) {
            console.log(' Need migrate ' + version);
            needMigrate.push(version);
            return false;
        }
        return true;
    });

    return needMigrate;
}

function checkFiles() {
    if (execFiles) {
        execDevFiles();
    }

    console.log('Start checking...');
    const files = fs.readFileSync('9_migrated_files.txt', {encoding: 'utf8'})
        .toString()
        .split('\n')
        .filter(Boolean);

    const needMigrate = [];
    const duplicates = [];
    files.forEach(file => checkVersionTree(file, needMigrate, duplicates));

    if (needMigrate.length) {
        // console.log('Need migrate files ' + needMigrate);
        return;
    }
    if (removeDuplicates && duplicates.length) {
        duplicates.forEach(file => {
            execSync(`cleartool rmlabel "${devLabel}" ${file}`);
        });

        console.log('Duplicates removed');
    } else if (!duplicates.length) {
        console.log('No conflicts');
    }
}

checkFiles();
