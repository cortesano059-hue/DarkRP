const { Client, GatewayIntentBits, Collection } = require("discord.js");
require('module-alias/register'); // para aliases
const commandHandler = require("@handlers/commandHandler");
const eventHandler = require("@handlers/eventHandler");
const componentHandler = require("@handlers/componentHandler");
const registerCommands = require("../../register.js"); // Ajusta según tu estructura

class MyClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ],
            partials: ['MESSAGE', 'CHANNEL', 'REACTION']
        });

        // Inicializar colecciones
        this.commands = new Collection();
        this.buttons = new Collection();
        this.selectMenus = new Collection();
        this.modals = new Collection();
        this.commandArray = [];

        // Manejo global de errores
        process.on("unhandledRejection", console.error);
        process.on("uncaughtException", console.error);
    }

    async loadHandlers() {
        console.log("🔄 Cargando comandos...");
        await commandHandler(this);

        console.log("🔄 Cargando eventos...");
        await eventHandler(this);

        console.log("🔄 Cargando componentes...");
        await componentHandler(this);
    }

    async start() {
        try {
            // Cargar handlers
            await this.loadHandlers();

            // Login
            console.log("🔐 Iniciando sesión...");
            await this.login(process.env.DISCORD_TOKEN);

            // Registrar comandos en Discord vía REST
            await registerCommands(this);

            console.log("✅ Bot iniciado correctamente");
        } catch (error) {
            console.error("❌ Error al iniciar MyClient:", error);
        }
    }
}

module.exports = MyClient;
