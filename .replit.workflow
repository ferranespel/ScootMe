run = ["tsx", "server/index.ts"]
hidden = ["node_modules", ".config"]
onBoot = ["npm", "install"]
language = "nodejs"

[packager]
language = "nodejs"
  [packager.features]
  packageSearch = true
  guessImports = false
  enabledForHosting = false

[env]
XDG_CONFIG_HOME = "/home/runner/.config"
PATH = "/home/runner/$REPL_SLUG/.config/npm/node_global/bin:/home/runner/$REPL_SLUG/node_modules/.bin"
npm_config_prefix = "/home/runner/$REPL_SLUG/.config/npm/node_global"

[nix]
channel = "stable-22_11"

[gitHubImport]
requiredFiles = [".replit", "replit.nix", ".config"]

[languages]
  [languages.typescript]
  pattern = "**/{*.ts,*.js,*.tsx,*.jsx}"
  syntax = "typescript"
    [languages.typescript.languageServer]
    start = "typescript-language-server --stdio"

[deployment]
run = ["sh", "-c", "node server.cjs"]
deploymentTarget = "cloudrun"