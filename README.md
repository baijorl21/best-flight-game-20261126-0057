# best-flight-game-20261126-0057
[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/baijorl21/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/baijorl21/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

**Sky Courier: Ring Run** — a chase-view flight game in plain canvas and ES modules. Thread all 10 glowing target rings over patchwork fields, a river and snow-capped mountains, then line up and land gently on the runway. The HUD and the lit instrument panel show altitude, speed, heading, vertical speed and throttle; stall too slow and the nose drops.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Arrow keys or WASD pitch and roll, Shift/Ctrl work the throttle, the mouse steers, Enter takes off, R flies again.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library in `vendor/makefun-game.ts`.

<sub>Entered on [make.fun](https://make.fun/bounty/best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
