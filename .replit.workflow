[nix]
channel = "stable-22_11"

[env]
PORT = "5000"
XDG_CONFIG_HOME = "/home/runner/.config"
PATH = "/home/runner/$REPL_SLUG/.config/npm/node_global/bin:/home/runner/$REPL_SLUG/node_modules/.bin"
npm_config_prefix = "/home/runner/$REPL_SLUG/.config/npm/node_global"

[Start app]
command = "node start.js"
onBoot = true
persistentRunning = true
restartOn = "change"