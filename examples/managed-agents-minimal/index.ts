import Anthropic from "@anthropic-ai/sdk";

const AGENT_ID = "agent_01WF7Zi94wT3aoARwbokY4TQ";
const ENVIRONMENT_ID = "env_01EJke59xGJxuacYDr433Adv";

// Credentials resolve from ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN,
// or an `ant auth login` profile.
const client = new Anthropic();

const message = process.argv.slice(2).join(" ") || "Hello! Briefly introduce yourself.";

async function main(): Promise<void> {
  const session = await client.beta.sessions.create({
    agent: AGENT_ID,
    environment_id: ENVIRONMENT_ID,
    title: "managed-agents-minimal demo",
  });
  console.log(`Session:  ${session.id}`);
  console.log(`Trace:    https://platform.claude.com/workspaces/default/sessions/${session.id}`);
  console.log(`Sending:  ${message}\n`);

  // Open the stream before sending — the stream only delivers events
  // emitted after it is opened.
  const stream = await client.beta.sessions.events.stream(session.id);

  await client.beta.sessions.events.send(session.id, {
    events: [{ type: "user.message", content: [{ type: "text", text: message }] }],
  });

  for await (const event of stream) {
    switch (event.type) {
      case "agent.message":
        for (const block of event.content) {
          if (block.type === "text") process.stdout.write(block.text);
        }
        process.stdout.write("\n");
        break;

      case "session.error":
        console.error(`\n[session error] ${JSON.stringify(event)}`);
        process.exit(1);

      case "session.status_terminated":
        console.error("\n[session terminated]");
        process.exit(1);

      case "session.status_idle":
        // Transient idles (waiting on a tool confirmation or custom tool
        // result) must not end the loop; only a terminal stop_reason does.
        if (event.stop_reason.type !== "requires_action") {
          console.log("\n[done]");
          return;
        }
        break;
    }
  }
}

try {
  await main();
} catch (error) {
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("Authentication failed — set ANTHROPIC_API_KEY or run `ant auth login`.");
  } else if (error instanceof Anthropic.NotFoundError) {
    console.error(`Agent or environment not found: ${error.message}`);
  } else if (error instanceof Anthropic.APIError) {
    console.error(`API error${error.status ? ` (${error.status})` : ""}: ${error.message}`);
  } else {
    console.error(error);
  }
  process.exit(1);
}
