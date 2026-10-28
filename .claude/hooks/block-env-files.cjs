// PreToolUse hook: blocks every tool from touching .env files (except .env.example).
const ALLOWED_NAMES = new Set(['.env.example']);

// Basename (or glob segment) that targets a .env file: .env, .env.local, .env.*, .env*, ...
const ENV_NAME_PATTERN = /^\.env($|[.*?[{])/i;

// .env reference inside a shell command, preceded by a path/argument boundary so
// `process.env.X` / `import.meta.env` / `$env:X` don't match.
const ENV_IN_COMMAND_PATTERN = /(?:^|[\s"'`=/\\:(<>|;&,[{])(\.env(?![\w-])(?:\.[\w.*-]+|\*)?)/gi;

// Scripts that print .env contents to stdout without naming the file in the command.
const ENV_DUMPING_SCRIPT_PATTERN = /env-?to-?base64/i;

const isEnvName =(name) => !ALLOWED_NAMES.has(name.toLowerCase()) && ENV_NAME_PATTERN.test(name);

const pathTargetsEnv = (value) => {
  if (typeof value !== 'string' || value === '') return false;
  return value.split(/[\\/]/).some(isEnvName);
};

const commandTargetsEnv = (command) => {
  if (typeof command !== 'string') return false;
  if (ENV_DUMPING_SCRIPT_PATTERN.test(command)) return true;
  for (const match of command.matchAll(ENV_IN_COMMAND_PATTERN)) {
    if (!ALLOWED_NAMES.has(match[1].toLowerCase())) return true;
  }
  return false;
};

const isBlocked = ({ tool_name: toolName, tool_input: input = {} }) => {
  switch (toolName) {
    case 'Bash':
    case 'PowerShell':
      return commandTargetsEnv(input.command);
    case 'Grep':
      return pathTargetsEnv(input.path) || pathTargetsEnv(input.glob);
    case 'Glob':
      return pathTargetsEnv(input.path) || pathTargetsEnv(input.pattern);
    default:
      return pathTargetsEnv(input.file_path) || pathTargetsEnv(input.notebook_path);
  }
};

let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    console.error(`block-env-files: invalid hook input (${error.message})`);
    process.exit(1);
  }

  if (!isBlocked(payload)) process.exit(0);

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          '.env files are off-limits in this project (only .env.example may be read or written). Ask the user to run the command themselves.',
      },
    }),
  );
});
