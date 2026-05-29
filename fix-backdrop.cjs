const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/*Modal.tsx');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
        /className="fixed inset-0 z-\[200\] flex items-center justify-center p-4"/g,
        'className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4"'
    );
    content = content.replace(
        /className="fixed inset-0 z-\[100\] flex items-center justify-center lg:items-end lg:justify-end lg:p-8 p-4 pointer-events-none"/g,
        'className="fixed inset-0 z-[100] flex items-center justify-center lg:items-end lg:justify-end lg:p-8 p-0 sm:p-4 pointer-events-none"'
    );
    content = content.replace(
        /className="fixed inset-0 z-\[100\] flex items-center justify-center p-4 pointer-events-none"/g,
        'className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 pointer-events-none"'
    );
    fs.writeFileSync(file, content, 'utf8');
});
console.log("Done");
