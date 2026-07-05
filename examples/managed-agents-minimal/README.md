# managed-agents-minimal

Minimal demo that talks to an Anthropic Managed Agent via the beta sessions API:
it creates a session for agent `agent_01WF7Zi94wT3aoARwbokY4TQ` in environment
`env_01EJke59xGJxuacYDr433Adv`, opens the SSE event stream, sends a `user.message`,
prints `agent.message` text as it arrives, and exits when the session goes idle.

## Setup

```sh
bun install
```

Authenticate with either an API key or an OAuth profile:

```sh
export ANTHROPIC_API_KEY=sk-ant-...   # or: ant auth login
```

## Run

```sh
bun run index.ts "Summarize what you can do"
```

Omitting the argument sends a default greeting. A Console trace URL is printed
so you can watch the session live.
