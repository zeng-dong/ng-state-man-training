# The State Ledger: Worked Examples

*Companion to the State Ledger worksheet. Counter-examples to argue about.*

> **This is not a recipe, and it isn't guidance.** It's a heuristic: a way to
> think about what you should be doing, so your team can have the discussion.
> This is the *application* part of application development: the decisions are
> yours, and they don't generalize. The grid's cells are where the argument
> starts, not where it ends.

---

## Should we guess? Making the decision visible

A guess (showing the outcome before the server confirms it) is worth making when
being wrong is rare enough, or cheap enough, that it beats making the user wait.

> **Guess when (how often it's wrong) × (cost of the apology) is smaller than
> (the cost of making them wait).**

Don't put numbers on it. Nobody knows that a hold request fails 4.7% of the
time, and an invented number is worse than none, because people start trusting
it. Use rough levels, and argue about which level applies:

**How often is the guess wrong?**
- **Rare**: you can't remember it happening.
- **Sometimes**: it happens every week, to somebody.
- **Often**: it's part of the normal flow (limits, availability, rules).

**What does the apology cost?**
- **Trivial**: something quietly un-does itself. ("This will only apply on this device.")
- **Annoying**: the user has to redo something, or they're told "no" after being told "yes".
- **Expensive**: real-world cost. A wasted trip, a missed deadline, money.
- **Can't apologize**: legal, financial, or irreversible. There's no sentence that makes it right.

| | Trivial | Annoying | Expensive | Can't apologize |
|---|---|---|---|---|
| **Rare** | Guess freely | Guess, show it's pending | Receipt only | Receipt only; confirm first |
| **Sometimes** | Guess, show it's pending | Receipt, maybe a candidate marked pending | Receipt only | Check first; don't guess |
| **Often** | Receipt, maybe a candidate | Check first | Check first | Check first; don't guess |

*"Check first"* means: ask the server before you let the user believe anything
(a precondition, a validation call, a "can I?" endpoint). *"Receipt only"* means:
say the true thing ("We've received your request"), and show nothing else as if
it were done.

**If your group can't agree on the level, that's not a disagreement about code.
It's a requirement nobody has written down.**

---

## The examples

Each one has a tempting answer. Decide yours before reading the counter.

### 1. Hiding reviews (a preference)

*Tempting:* Save it to the server, show a spinner until it's saved.
*Counter:* Wrong **rare**, apology **trivial**. Guess freely: flip the toggle
right away. If the save fails, the apology is one sentence, and the preference
still works on this device. A spinner here costs more than every failure
combined.

### 2. Placing a hold

*Tempting:* Add it to "My holds" immediately (optimistic UI!).
*Counter:* Wrong **sometimes** (hold limits, a fine on the account), apology
**annoying**. Show a receipt, and if you show it in the list, mark it pending
("Requested: we'll confirm shortly"). Don't let a guess look like a fact.

### 3. Paying a fine

*Tempting:* It's a payment provider, they're reliable. Show "Paid".
*Counter:* Wrong **rare**, but apology **expensive** (or worse: "You told me it was
paid, so I didn't pay it, and now my account is blocked"). Receipt only:
"Payment submitted." "Paid" appears when it's true.

### 4. Renewing a loan

*Tempting:* Renew it optimistically; it almost always works.
*Counter:* For a popular book it's wrong **often**: renewal is blocked when
someone has a hold. And "your book is due tomorrow after all" is **annoying**
going on **expensive**. Check first: the page already knows (or could ask) whether
there's a wait list. Here the cheapest guess is no guess, because the answer is
one request away.

### 5. "On the shelf at Northside"

*Tempting:* That isn't a guess, it's what the API said.
*Counter:* It's what the API said **eleven minutes ago**. Showing old data as
current is a guess too, just an implicit one. Wrong **sometimes** (someone checks
it out), apology **expensive** (a wasted trip). Say something true: "On the shelf
as of 10:42", or refresh when the window regains focus, or both.

### 6. Adding something that takes three API calls

*Tempting:* Chain them, guess success, roll back on failure.
*Counter:* Confidence multiplies: three steps at "rare" failure each are no
longer rare together. And the case that breaks it is **two out of three
succeeded**. Write that apology: "Your item has been *mostly* added"? If you can't
describe the apology for a partial success, you haven't earned the guess. This
is one request to a server that owns the whole workflow.

### 7. Two tabs, one counter

*Tempting:* Save the count to localStorage and sync the tabs.
*Counter:* Each tab is guessing that it has the latest count. If both send
"the count is 5", one tab's increment is lost, and nobody is told: the apology
is **can't apologize**, because nobody knows it happened. Send what the user did
("increment"), not what the screen thinks the state is.

### 8. Removing an item from a list

*Tempting:* Delete is simple. Remove it from the list right away.
*Counter:* Usually right. Wrong **rare**, apology **annoying** ("we couldn't
remove it, so it's back"). Guess, but make the guess visible (dim it, "removing…")
so that if it comes back, the user saw it was never really gone. An item that
silently reappears is a bug report; an item that reappears with a sentence is an
apology.

---

## For your own screens

Pick the riskiest guess your app makes today (the one where the screen says
something before it's true). Place it in the grid. Then answer:

1. Which level did your group disagree about, and who would know the real answer?
2. What does the apology actually say today? (If the answer is "an error
   toast", write the real sentence.)
3. If you moved it one cell toward "check first", what would it cost the user?
