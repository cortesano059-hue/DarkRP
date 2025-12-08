// fixModels.js
const fs = require("fs");
const path = require("path");

const base = path.join(__dirname, "src");

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, "utf8");
    const original = content;

    // Reemplazos
    const patterns = [
        /require\(.*models\/Dni.*\)/g,
        /require\(.*models\/DutyStatus.*\)/g,
        /require\(.*models\/Backpack.*\)/g,
        /require\(.*models\/Item.*\)/g,
        /require\(.*models\/User.*\)/g,
        /require\(.*models\/Inventory.*\)/g,
    ];

    for (const p of patterns) {
        content = content.replace(p, `require("@database/mongodb")`);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log("✔ Arreglado:", filePath);
    }
}

function scan(folder) {
    const items = fs.readdirSync(folder);

    for (const item of items) {
        const full = path.join(folder, item);
        const stat = fs.statSync(full);

        if (stat.isDirectory()) {
            scan(full);
        } else if (item.endsWith(".js")) {
            fixFile(full);
        }
    }
}

console.log("🔍 Buscando archivos que usan modelos antiguos...");
scan(base);
console.log("🎉 Fix aplicado. Reinicia el bot.");
