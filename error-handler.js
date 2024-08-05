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
        if (!error.errCode) {
            if (error.statusCode) {
                errCode = error.statusCode;
            }
        } else {
            errCode = error.errCode;
        }
        // Based on error code, inform user
        switch (errCode) {
            /* ========== Normal HTML error codes (4xx, 5xx) ========== */
            case 403:
                // Error 403 means that the bot has been rate-limited by Google
                interaction.editReply('YouTube has rate-limited me, my developer is currently looking into ways to fix this. In the meantime, I may be unable to play new media');
                break;
            case 410:
                // Error 410 means that the requested song is age-restricted
                if (state == "playlist") {
                    interaction.editReply('At least one of the songs in your playlist is age-restricted and can\'t be played');
                } else if (state == "song") {
                    interaction.editReply('That song is age-restricted and can\'t be played');
                }
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
                interaction.editReply('You found an unhandled error! Let my developer know so that he can fix it');
                console.error(error);
                break;
        }
    }
};