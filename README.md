# GaloBot

This is a Discord bot build in Javascript using DiscordJs. It is just intended to be a music bot, as all of those seem to be dying off.

Known Bugs:
- If the bot errors while downloading a song, it leaves a corrupted file behind that must be manually removed before the bot can play that song
- Sometimes when playing the first song after entering a voice channel, the bot won't play it. Subsequent requests work just fine

Command List:
- /play : Given a YouTube song link or playlist link, play that song or playlist
    - One required option: The YouTube URL of the desired song or playlist
    - Two optional options: "loop" and "shuffle", which just run the respective command automatically after starting to play
- /pause : Pauses the current song
- /unpause : Unpauses the current song
- /skip : Skips the current song
    - One optional option: "position" lets you skip to a certain position in the queue
- /queue : Displays the current queue, as well as current looping status
- /clear : Clears out the queue including the currently playing song
- /shuffle : Randomizes the order of the queue
- /loop : Loops either the current song or entire queue, based on the argument chosen
    - One required option: "type", which can be either "song" or "queue"
        - "song" loops just the current song, while "queue" loops the entire queue