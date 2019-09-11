const execSync = require('child_process').execSync;
const fs = require('fs');
const readline = require('readline');

const logName = `.\\logs\\${(new Date()).toISOString()
                    .replace(/T/, '_')
                    .replace(/\..+/, '')
                    .replace(/:/g, '-')}`;
const inputFile = './2_change-list.txt';
const needMigrate = process.argv.includes('--migrate');

let label = process.argv[2];
let comment;
let text;

const addToText = str => {
    text += '\n' + str;
};

const getVersion = file => {
    const stdout = execSync(`cleartool describe -fmt "%n|||%c" "${file}"`, { encoding: 'utf8' })
        .split("|||");
    const version = stdout[0];
    comment = stdout[1];
    if (version.indexOf('@@\\main\\CHECKEDOUT') > -1) {
        console.warn(`Skipping ${version} -- not checked in`);
        return false
    }

    fs.appendFileSync(`${logName}.txt`, version.replace('\\', '/'));
    return version.replace(/\r\n/, '').replace('\\', '/')
};

const applyLabel = async version => {
    const stdout = execSync(`cleartool mklabel -replace "${label}" "${version}"`, { encoding: 'utf8' });
    addToText('/GetCaesar/' + version);
    fs.appendFileSync(`${logName}.cleartool.txt`, stdout);
    fs.writeFileSync(inputFile, '', error => console.log(error));
};

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, async ans => {
        rl.close();
        await resolve(ans);
        process.exit()
    }))
}

askQuestion(`Label to apply (${label}): `).then(answer => {
    label = answer.replace(/[^\w\d._]/g, '') || label;
    const files = fs.readFileSync(inputFile, {encoding: 'utf8'})
        .split('\n')
        .filter(Boolean);
    const versions = needMigrate ? files : files.map(getVersion).filter(Boolean);
    console.log('*********** Applying labels ***********\n');
    addToText('*Check In*');
    addToText('{code}');
    versions.forEach(applyLabel);
    addToText('{code}');
    console.log(text);
    require('child_process').spawn('clip').stdin.end(util.inspect(text));
    console.log(comment);
}).catch(reason => console.log(reason));
