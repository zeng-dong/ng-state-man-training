# Using an AI Assistant While You Learn State Management

*Small prompts that make an assistant a sparring partner instead of a code generator. Each one happened while building this course's materials, and each works in a plain chat window.*

The pattern under all of them: **ask for the questions, the failures, and the rejected options, not just the answer.** An assistant handed a frame will usually build inside it, very well. Asking it to argue with the frame is the part you have to remember to do.

- **Ask what the mockup can't answer.** Before asking for a page, paste the mockup and ask: "What questions does this mockup not answer that I should answer before building it? What happens when one of these sections fails, or is slow?" Given only the mockup, an AI will build the best `forkJoin` you've ever seen, and it will be wrong. Asked for the questions first, it's a useful sparring partner. The skill is knowing to ask.

- **Ask for the list, then ask which ones it would do.** "What do developers commonly get wrong with Angular signals and HTTP?" Then the better question: "Which of those would *you* produce if I asked you plainly?" It will name some of its own habits (catching errors into an empty list, `effect()` to sync signals, `switchMap` on a save). Now you know what to look for in what it hands you.

- **Have it write the honest "before," then predict how it breaks.** "Write this the way a capable developer on a deadline would: working on the happy path, no strawman." Then: "Which failure scenarios would break it, and what would the user see?" Then break it for real (slow network, a failed request, two responses out of order) and compare. Where its prediction was wrong is where your understanding just grew.

- **Make it check the installed package, not its memory.** Libraries move faster than a model's training. When something should work and doesn't, ask: "Read the type definitions in `node_modules` for this and tell me what they say," rather than "how does X work?" Its knowledge has a date; the installed package doesn't. (Building this course turned up two cases where the docs-from-memory answer was wrong.)

- **Ask how you'd know it works, and make the check observable.** "How would we know this is right, in a way we could watch?" A request count in the network log, a status in the response, a value in the URL. "It should work" isn't evidence; a request that didn't happen is.

- **Ask what it decided not to do.** After it proposes a design: "What did you consider and reject, and why?" The rejected options are where the tradeoffs live, and nothing in the code will ever show them. Write the good ones down; three weeks later someone will propose one again.

- **Invite the pushback explicitly.** "Before you answer: is anything off about how I'm framing this?" Assistants tend to go along with the frame you hand them. Asking for disagreement first changes what you get back, and the disagreement is often the most useful part.

- **Write the one-sentence description of your store.** Tools increasingly ask for it (so an AI can read your app), and it's a good test for a human too: "What does this store manage, and why?" If you can't write the sentence, the store probably has no clear job. Ask the AI to argue with your sentence.

- **Use it to draft the ledger, then overrule it.** Paste a screen and ask it to fill in the state ledger: what's inside, what's outside, who owns it, how stale it may be. It will be confidently wrong about ownership, because it can't know your systems. You can. Correcting it is a fast way to find out what you actually know about your own app.

- **Record an interaction, then ask what's wrong with the page.** With a recording tool (Stellar DevTools: click record, do the thing, "Copy for AI"), the AI gets a cause-and-effect graph instead of your description of it: what each click requested, what waited on what, what changed in which store. Ask: "What's wrong with this page?" It can see things you'd only find with the network tab and patience: the same lookup table fetched on every click, a request that waits on another for no reason, a store that never changes.

- **Turn a recording into tests.** A recording of a real use case is already a scenario: the starting state is the *given*, the clicks are the *when*, the responses and state changes are the *then*. Paste it and ask: "Write given/when/then tests for what this recording shows the app should do." The tests describe what a user actually did, not what someone imagined they'd do. (Ask what the recording *doesn't* show, too: the failure cases are the ones you didn't record.)

- **Ask for a diagram of what you just built.** "Draw a Mermaid sequence diagram of what happens when the user clicks Place hold, from the click to the screen updating." Read it against your mental model. Where they disagree, one of you is wrong, and finding out which is the lesson. Diagrams used to cost too much to keep; now they're cheap enough to regenerate whenever the code changes, so don't patch an old one by hand.

---

*Written October 2026 with Claude (Opus 5.5), from things that happened while building this course with it. Like everything else here, it describes the tools as they were; ask the assistant you use today which of these it would change.*
