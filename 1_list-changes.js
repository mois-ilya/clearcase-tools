const execSync = require('child_process').execSync;
const fs = require('fs');
const parser = require('fast-xml-parser');

/**
 *      Checks if current version is the latest version in the tree
 *      So that check in will go without conflicts
 *      !!! May not work properly for multiple branches
 * */
const checkVersionTree = path => {
    try {
        path = path.trim();
        const stdout = execSync(`cleartool lsvtree "${path}"`, { encoding: 'utf8' });
        const versions = stdout.split('\n').filter(x => x.trim() !== '');
        const lastVersion = versions.pop();
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

const data = fs.readFileSync('.idea/workspace.xml', "utf8");

if( parser.validate(data) === true) {
    const workspace = parser.parse(data, {
        attributeNamePrefix : "",
        attrNodeName: "attr",
        ignoreAttributes : false,
        ignoreNameSpace : false,
        parseAttributeValue : true
    });

    const changeListManager = workspace.project.component.find(item => item.attr.name === 'ChangeListManager').list;

    const defaultPreChange = Array.isArray(changeListManager) ? changeListManager : [changeListManager];
    const defaultChange = defaultPreChange.find(item => item.attr.default).change;

    const defaultChangeList = Array.isArray(defaultChange) ? defaultChange : [defaultChange];
    const paths = defaultChangeList.map(item => {
        const value = item.attr.afterPath.replace('$PROJECT_DIR$/', '');
        if (!item.attr.beforePath) { // beforePath is not defined for new files
            checkVersionTree(item.attr.afterPath)
        }
        return value;
    });

    fs.writeFile("./2_change-list.txt", paths.join("\n"), err => err ? console.error(err) : '');
}
