const { devUID } = require('./config.json');

module.exports = class ErrorHandler {

    // Handle an error, reponding to the interaction accordingly
    // @param error
    //          Should be an error object, as returned by ytdl (can be a custom error object, just follow the same structure)
    //
    // @param state
    //          String, either "song" or "playlist", used to understand the context that the error was created in
    //
    handle(error, interaction, state) {
        var errCode = 0;
        // Try to find the error code, it can be in different places depending on where the error was
        if (error.errCode) {
            errCode = error.errCode;
        } else if (error.statusCode) {
            errCode = error.statusCode;
        }
        // Based on error code, inform user
        switch (errCode) {
            /* ========== Normal HTML error codes (4xx, 5xx) ========== */
            case 403:
                // Error 403 means that the bot has been rate-limited by Google
                interaction.editReply('YouTube has fundamentally changed how I have to communicate with their server, for the forseeable future I won\'t be able to download new music (songs you\'ve already downloaded will work fine though)');
                break;
            case 410:
                // Error 410 means that the requested song is age-restricted
                if (state == "playlist") {
                    interaction.editReply('At least one of the songs in your playlist is age-restricted and can\'t be played');
                } else if (state == "song") {
                    interaction.editReply('That song is age-restricted and can\'t be played');
                }
                break;
            case 429:
                // Error 403 means that the bot has been rate-limited by Google
                interaction.editReply('YouTube has rate-limited me, try again in a few minutes (songs that have already been played will still be available though)');
                break;

            /* ========== Custom error codes (6xx) ========== */
            case 601:
                // Error 601 means the playlist is set to private or does not exist
                interaction.editReply('That ' + state + ' is either set to private or does not exist')
                break;
            case 602:
                // Error 602 means the bot is trying to play a song whose file can't be accessed, likely due to being marked for deletion from a previous error
                interaction.editReply('You tried to play a song whose file is corrupted, likely due to a previous error. Send my developer the YouTube URL and he can clean it up');
                break;
            default:
                if (devUID) {
                    interaction.editReply('You found an unhandled error! Hey <@' + devUID + '>, fix it please');
                } else {
                    interaction.editReply('You found an unhandled error! It has been logged, please let my developer know');
                }
                console.error(error);
                break;
        }
    }
};