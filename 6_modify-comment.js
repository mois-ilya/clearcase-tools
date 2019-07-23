const util = require('util')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs')
const readline = require('readline')
const inputFile = './6_versions.txt'

const modifyComment = async (version, newComment) => {
    const {stdout, stderr} = await exec(`cleartool chevent -c "${newComment}" -replace ${version}`)
    if (stderr) {
        console.error(stderr)
    }
}

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

askQuestion(`New comment: `).then(answer => {
    const versions = fs.readFileSync(inputFile, {encoding: 'utf8'})
        .toString()
        .split('\n')
        .filter(x => x.trim() !== '')
    Promise
        .all(versions.map(async version => await modifyComment(version, answer)))
        .then(() => console.log('Comment modified'))
}).catch(reason => console.log(reason))

