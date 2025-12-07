module.exports = async (client, interaction) => {
    // Verificamos que sea un menú desplegable
    if (!interaction.isStringSelectMenu()) return;

    // Verificamos que el ID del menú empiece por 'help-category'
    if (!interaction.customId.startsWith('help-category')) return;

    // Obtenemos la categoría que el usuario seleccionó
    const selectedCategory = interaction.values[0];

    try {
        // --- AQUÍ ESTABA EL ERROR ---
        // Buscamos explícitamente el comando llamado 'comandos' que es donde guardamos la función.
        const command = client.commands.get('comandos'); 

        // Si por alguna razón el bot no cargó el comando, evitamos que crashee
        if (!command) {
            console.error("❌ CRITICAL: El handler no encuentra el comando 'comandos' en client.commands.");
            return await interaction.reply({ 
                content: "Hubo un error interno recargando el menú. Intenta usar /comandos de nuevo.", 
                ephemeral: true 
            });
        }

        // Ejecutamos la función estática que creamos en el archivo del comando
        // Le pasamos (client, interaction, categoria) tal cual lo definimos antes
        const newEmbeds = command.buildCategoryEmbeds(client, interaction, selectedCategory);

        // Actualizamos el mensaje original con los nuevos embeds (Banner + Categoría)
        await interaction.update({
            embeds: newEmbeds,
            // Mantenemos el mismo menú desplegable para que puedan seguir cambiando
            components: interaction.message.components 
        });

    } catch (error) {
        console.error("🔴 Error en menú help-category:", error);
        // Intentamos avisar al usuario si no se ha respondido ya
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: "Ocurrió un error al cambiar de categoría.", ephemeral: true });
        }
    }
};