// fixBackpacksFinal.js
console.log("📌 Cargando .env desde /home/node/.env");

require("dotenv").config({
    path: "/home/node/.env"   // <<--- RUTA CORRECTA
});

if (!process.env.MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI no está definido en el .env");
    process.exit(1);
}

console.log("📌 Conectando a MongoDB...");

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
})
.then(() => console.log("🟢 MongoDB conectado correctamente"))
.catch(err => {
    console.error("❌ Error MongoDB:", err);
    process.exit(1);
});

// Importar modelos RRUTA CORRECTA A TU MONGODB
const { Backpack } = require("/home/node/src/database/mongodb.js");

(async () => {
    console.log("🧰 Iniciando reparación de mochilas...");

    const mochilas = await Backpack.find({});
    console.log(`📦 Mochilas encontradas: ${mochilas.length}`);

    for (const bp of mochilas) {
        let changed = false;

        // Convertir mochilas antiguas al nuevo esquema
        if (!bp.accessType) {
            bp.accessType = "owner_only";
            changed = true;
        }

        if (!Array.isArray(bp.allowedUsers)) {
            bp.allowedUsers = [];
            changed = true;
        }

        if (!Array.isArray(bp.allowedRoles)) {
            bp.allowedRoles = [];
            changed = true;
        }

        if (changed) {
            await bp.save();
            console.log(`💾 Mochila reparada: ${bp.name}`);
        } else {
            console.log(`✔ Mochila correcta: ${bp.name}`);
        }
    }

    console.log("\n🎉 Reparación completada sin errores.");
    process.exit(0);
})();