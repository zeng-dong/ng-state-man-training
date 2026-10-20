# The State Ledger

*A worksheet for deciding what your UI actually knows, and what it should say about it.*

---

## Why we're doing this

Before you write any state-management code (store, signal, effect, `switchMap`), you need to answer questions that aren't about code at all:

- **Who owns this piece of data?**
- **How old is it allowed to be?**
- **What do we show while we're waiting?**
- **What happens if we guessed wrong, and what do we say?**

Once those are answered, the code is usually obvious. While they're unanswered, no amount of clever RxJS will save you.

Two words we'll use all day:

- **Inside data** is owned by *this* app, here, now. The UI is the source of truth for it. Examples: what's typed in a form, which row is selected, which step of a wizard you're on, the fact that the user *clicked Submit*.
- **Outside data** came from somewhere else. It's a **memory** of what another system said at some moment. It's already a little stale when it arrives. Examples: the policy, the customer, the list of vehicles, the premium.

A third idea: a **guess** is when the UI acts as if something is true before it knows. An **apology** is what the UI does when the guess turns out wrong. If you can't describe the apology, you haven't earned the guess.

---

## The scenario

> **Add a Vehicle to a Policy**
>
> A customer (or an agent on their behalf) is looking at their auto policy. They:
>
> 1. See their policy summary: policyholder, policy number, term dates, current premium.
> 2. See the list of vehicles currently on the policy.
> 3. Click **Add Vehicle** and start a short wizard.
> 4. Enter a VIN. The screen looks up year/make/model as they type.
> 5. Choose coverages for the new vehicle (some options depend on the vehicle and the state).
> 6. See an **estimated** premium change.
> 7. Click **Submit**.
>
> Behind the scenes, these are separate systems with separate APIs: Policy, Vehicle/VIN Lookup, Coverage Rules, Rating, and a back-office process that actually changes the policy, sometimes in seconds and sometimes overnight.

*(Your instructor may swap in a screen from your own world. Better yet, bring one.)*

---

## Part 1: Fill in the ledger

List every piece of state the screen touches, one per row. Be specific: "the premium" isn't one thing. There's the *current* premium, the *estimated new* premium, and the *actual new* premium, and they're different rows.

| # | State | Inside or Outside? | Who owns it? (system / person) | How stale may it be? | Do we guess? | If wrong, the apology is… | Worth the ceremony? |
|---|---|---|---|---|---|---|---|
| ex | Vehicles currently on policy | Outside | Policy system | Minutes is fine; refetch after a change | No | n/a | Low: just refetch on return |
| ex | "User clicked Submit" | **Inside** | This UI | n/a: it's a fact *now* | n/a | n/a | High: this is the intent we must never lose |
| 1 | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |
| 4 | | | | | | | |
| 5 | | | | | | | |
| 6 | | | | | | | |
| 7 | | | | | | | |
| 8 | | | | | | | |
| 9 | | | | | | | |
| 10 | | | | | | | |

### Column guide

- **Inside or Outside?** Ask: *if this value in the browser disagrees with a server, who wins?* If the server wins, it's outside. If nothing else in the world knows this value yet, it's inside.
- **Who owns it?** Name the system or the person. "The backend" isn't an answer; there are five backends.
- **How stale may it be?** Seconds? Minutes? "Until the user leaves the page"? "Must be checked at the moment of submit"? Different answers lead to different code, so write one down.
- **Do we guess?** Do we show the outcome before we know it (optimistic update, assumed success, "probably still available")?
- **The apology.** Write the actual words or behavior the user sees. "Show an error" doesn't count. *What error? What can they do next? Who contacts whom?*
- **Worth the ceremony?** Not everything deserves careful handling. Sometimes the right answer is "just refetch it" or "it's fine if it's a little off." Being able to say *this one doesn't matter* is as much a skill as handling the ones that do.

---

## Part 2: The life of an intent

Pick the most important thing the user *asks for* on this screen (here, **adding the vehicle**). Draw its lifecycle.

A request isn't a fact. "Please add this vehicle" is true the moment they click. "This vehicle is on your policy" becomes true later, maybe much later, and maybe never.

```
  Drafting  ──►  Requested  ──►  Received  ──►  In progress  ──►  Done
                     │               │               │
                     └──► Failed to send             └──► Needs attention
```

For **each state**, answer:

| State | What is *true* right now? | What does the screen say? | What can the user do? | How do we learn we've moved on? |
|---|---|---|---|---|
| Drafting | | | | |
| Requested | | | | |
| Received | | | | |
| In progress | | | | |
| Done | | | | |
| Needs attention | | | | |
| Failed to send | | | | |

**Rule of thumb:** the screen should always be able to say something **true**. "Your vehicle has been added" isn't true yet. "We've received your request to add the 2022 Civic. Most changes finish within a few minutes, and we'll let you know here and by email" is true.

Questions to argue about:

1. What if the user closes the browser while the request is "In progress"? Where does that intent live now?
2. What if they click Submit twice? Is the second click a new request or the same one? (How would the server know?)
3. What if they open the policy in a second tab while it's in progress? What should *that* tab show?
4. Today, without this screen, how does the business handle a change that fails *after* the customer was told it was received? (Hint: there's already an apology process. It's probably a letter or a phone call.)

---

## Part 3: Operators are business decisions

For each user action that triggers a request, pick the policy. Don't pick an operator yet. Pick the **sentence**, and get someone from the business to agree with it.

| Situation | "Only the latest matters" | "Every one counts, in order" | "Every one counts, any order" | "Ignore new ones until this finishes" |
|---|---|---|---|---|
| Typing a VIN (lookup as you type) | | | | |
| Changing coverage options (re-estimate premium) | | | | |
| Clicking **Submit** | | | | |
| Removing two vehicles quickly in a row | | | | |
| Refreshing the policy summary | | | | |

*Afterward:* these sentences map to `switchMap`, `concatMap`, `mergeMap`, and `exhaustMap`. If your team can't agree on the sentence, that's a missing requirement, not a missing RxJS skill.

---

## Part 4: The four-call question

The screen needs Policy, Vehicles, Coverage Rules, and Rating together. Before writing a `combineLatest` / `forkJoin`, answer:

1. These four responses describe four different moments. **Does it matter if they disagree with each other?** Give a concrete example where it would.
2. Can parts of the screen render independently, each with its own loading and staleness? Or does it truly need all four to be meaningful?
3. **Should this join happen in the browser at all?** Is there a missing API (a composite endpoint or backend-for-frontend) that *should* own this? Who would you need to convince?
4. If the join stays in the browser: when one of the four fails, what does the screen show?

---

## Part 5: Reflection

- Which row in your ledger caused the most disagreement on your team? Why?
- Name one place in a real app you work on where the UI says something that **isn't true yet**.
- Name one place where you're doing careful, clever work on something that **doesn't need it**.
