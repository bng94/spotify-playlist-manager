# Spotify Playlist Manager

A web app that lets users create, edit, and manage their playlists, and bulk remove songs from playlists.

I tend to add a lot of songs I like — or discover them through the Shazam app — into my Spotify playlists, and now have over 200 songs that need to be rearranged. Spotify doesn't have a way to select multiple songs in a playlist at once to move them to another playlist or remove them outright, but with the Spotify API, I decided to build that capability.

## Setup

1. [Register a Spotify App](https://developer.spotify.com/dashboard/applications) and add Redirect URI as `http://127.0.0.1:5173/callback` 
2. Create an `.env` file with the following:
```
VITE_SPOTIFY_CLIENT_ID=yourSpotifyClientIDHere
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
```
3. `npm install`
4. `npm run dev`