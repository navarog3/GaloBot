# GaloBot

This is a Discord bot build in Javascript using DiscordJs. It is just intended to be a music bot, as all of those seem to be dying off.

Known Bugs:
- /status can crash the bot by running the player.on status == idle event with an empty queue but tries to play a song despite the if check
    - This only has happened once and I've been unable to reproduce it yet
- Bot can't play age-restricted videos on YouTube due to not being able to sign in. As far as I know, this is unsolveable

Command List:
- /play : Given a YouTube song link or playlist link, play that song or playlist
    - One required option: The YouTube URL of the desired song or playlist
    - Two optional options: "loop" and "shuffle", which just run the respective command automatically after starting to play
- /pause : Pauses the current song
- /unpause : Unpauses the current song
- /skip : Skips the current song
- /queue : Displays the current queue
- /clear : Clears out the queue including the currently playing song
- /shuffle : Randomizes the order of the queue
- /loop : Loops either the current song or entire queue, based on the argument chosen
    - One required option: "type", which can be either "song" or "queue"
        - "song" loops just the current song, while "queue" loops the entire queue
- /status : Displays the currently playing song as well as the current loop status