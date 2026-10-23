<img src=".github/video.svg" width="130" alt="">

# /video-demo

Skill to make your agent record demo of your web app with voice over all on your machine.

Given below is a sample video generated using the skill for [roadmap.sh](https://roadmap.sh).

https://github.com/user-attachments/assets/c20907c2-89a4-42a8-95d6-271ba3a60b80

## Record a Demo

Install the skill

```bash
npx skills add nilbuild/video-demo
```

Then ask your agent 

```bash
/video-demo [explain what to recorded]

/video-demo record a demo of https://example.com
/video-demo record the checkout flow on https://example.com, use cash on delivery
/video-demo visit http://roadmap.sh and record the roadmap search flow
/video-demo record the login flow in the current project
```

Be as broad or as specific as you like. You can also add video instructions too e.g. "tell them it works offline now", "mention the keyboard shortcut", "keep it under twenty seconds".

## Ask for updates

If you are not happy with the produced recording, you can ask for updates to the recorded video e.g.

- "that line is too long", "say screenshots, not stills"
- "zoom in more on the toolbar", "stop zooming so much"
- "slow down at the end", "say thanks for watching at the end"
- "record the calendar first", "record the pricing page too"
- "try a different voice", "no voice-over on this one"

Say what is wrong and it can keep re-recording until you are happy.

## What you get

An mp4 video is produced with the voice-over on it. It also keeps screenshots at every moment
worth keeping. Everything is done on your local machine.

## Licence

MIT © [Kamran Ahmed](https://kamran.fyi).
