# The State Top 10

*Ten ways front-end state goes wrong, ranked by how much they hurt and how often they happen.*

---

## How to read this

**Ranked by harm × frequency**: how badly the mistake hurts the people using the app, times how often it shows up in real code. Each entry gives its reason for its rank, so you can disagree with it.

**What it is not:** a checklist to apply. Every item is a question you ask about your own screen. The answers depend on your app, and that's the point.

**"Easy to show" is a separate column, and it doesn't affect the ranking.** Some of the most damaging mistakes make dull demos, and some of the best demos are of mistakes that rarely matter. Notice which ones get the most attention in a room, and why.

⚠️ marks mistakes AI coding assistants produce themselves when asked plainly. If you use one, these are the ones to look for in what it hands you.

| # | Mistake | Easy to show? |
|---|---|---|
| 1 | Treating the server's data as if the browser owned it | Hard |
| 2 | Saying something that isn't true yet | Easy |
| 3 | Turning errors into "nothing" ⚠️ | Easy |
| 4 | All-or-nothing pages | Easy |
| 5 | Requests that happen twice ⚠️ | Easy |
| 6 | Operators chosen by habit ⚠️ | Easy |
| 7 | Effects that copy state ⚠️ | Medium |
| 8 | Copies that drift ⚠️ | Medium |
| 9 | Caches that never forget ⚠️ | Medium |
| 10 | Apologies that overwrite | Medium |

---

## 1. Treating the server's data as if the browser owned it

**Looks like:** a store that holds every entity from the API "so we can join it," then edits, merges, and filters that copy as though it were the truth. Often the first thing a team builds, and the last thing they question.

**Why it hurts:** everything the app holds from an API is a *memory* of what the server said at some moment. Treat it as the truth and every other screen, tab, user, and system that changes it becomes a bug you can't see. The copy drifts, and nothing tells you.

**The question:** *If the browser's copy disagrees with the server, who wins?* If the server wins, it's a memory: read it (a resource), don't own it (a store).

**Why #1:** it's the root of half the list below, and it's everywhere. It's hard to demonstrate because nothing breaks on the day you write it.

**In the course:** Day 1 (inside and outside, the state ledger), Day 2 (what does a store *decide*?).

## 2. Saying something that isn't true yet

**Looks like:** "Hold placed!" when the server answered 202 Accepted. An optimistic update shown as if it were confirmed. A success toast for a request that hasn't been decided.

**Why it hurts:** the user acts on it. They stop checking, they tell someone, they don't place the hold somewhere else. When it turns out to be false, the apology arrives later, by phone or by letter, or not at all.

**The question:** *What's actually true right now?* There's always a true sentence: "We've received your request" is true the moment the server accepts it. "Received" is not "done."

**Why #2:** the harm lands on a person, and it's the default shape of most submit handlers.

**In the course:** Lab 2 (Place a Hold), Day 3 (pending as a state).

## 3. Turning errors into "nothing" ⚠️

**Looks like:** `catchError(() => of([]))`. A failed request that renders as "No results." A table that says "You have no holds" because the request for your holds failed.

**Why it hurts:** "there's nothing there" and "we couldn't find out" look identical, and the user believes the first. They stop looking for something that exists.

**The question:** *Can the user tell "empty" from "couldn't load"?*

**Why #3:** it's one line, it looks responsible ("we handled the error!"), and it's one of the most common things assistants generate.

**In the course:** Lab 2 Part 1 (the holds table when the API is down).

## 4. All-or-nothing pages

**Looks like:** one `forkJoin` of every request the page needs, one loading spinner, one error message. Usually built faithfully from a mockup that shows every section filled in at once.

**Why it hurts:** one slow or failing system (the reviews service, say) blanks the whole page or makes all of it wait. The user came to answer one question ("is it on the shelf?") and gets nothing.

**The question:** *What did the user come here to find out, and does that part need to wait for the rest?* Each section can own its own data, its own loading, and its own failure.

**Why #4:** it fails the user exactly when the system is having a bad day, and it's how most pages built from mockups start.

**In the course:** Lab 1 (the title page), Day 1 afternoon (time to answer).

## 5. Requests that happen twice ⚠️

**Looks like:** a Submit with no guard; a client-generated id created *per click* instead of per request; a retry interceptor that retries POSTs; a disabled button as the only protection (a second click can arrive before the button re-renders).

**Why it hurts:** two holds, two orders, two payments. A retry on a request that isn't idempotent is a double-click by the computer.

**The question:** *If this request is sent twice, is that one thing or two?* Give the request an identity once, when the user's intent is formed, and send that identity every time.

**Why #5:** the harm can be money, and every "Try again" button is a chance to do it.

**In the course:** Lab 2, Day 2 (idempotency, the client as a participant).

## 6. Operators chosen by habit ⚠️

**Looks like:** `mergeMap` on a search or a route change, so a slow old response arrives last and wins (the URL says one thing, the page shows another). `switchMap` on a save, which cancels the *request* but not the server's *effect*.

**Why it hurts:** the screen shows the wrong record, intermittently, and nobody can reproduce it. Or the user believes a save was cancelled that actually happened.

**The question:** *What's the business rule here?* Only the latest matters; every one counts, in order; every one counts, any order; ignore new ones until this finishes. An operator is a business policy with no name. Pick the sentence first.

**Why #6:** a classic, and easy to fix once it's named; it ranks below the others because modern tools (resources keyed on their inputs) prevent the read-side version by default.

**In the course:** Lab 1 Part 1 (out-of-order responses), Day 2 (operators are business decisions).

## 7. Effects that copy state ⚠️

**Looks like:** `effect(() => this.b.set(something(this.a())))`, one signal copied into another.

**Why it hurts:** for a moment, `b` is out of date; effects that write to signals can loop; and the dependency is hidden in an effect instead of declared. The screen flickers through states that were never true, and the code gets harder to change.

**The question:** *Is this value derived from that one?* Then it's a `computed`. If the user must also be able to change it, it's a `linkedSignal`. An `effect` is for leaving the signal world (logging, reloading a resource, talking to the DOM).

**Why #7:** probably the most common mistake in new Angular code, because "effect" sounds like what you want. Usually more confusing than harmful, which keeps it out of the top half.

**In the course:** Day 1 (signals), Lab 2 "after" (the pickup branch as a `linkedSignal`).

## 8. Copies that drift ⚠️

**Looks like:** a filtered list, a total, or a count stored as state next to the data it came from. An input copied into a field in `ngOnInit`, so when the route changes and the component is reused, it still shows the old value.

**Why it hurts:** the copy and the original disagree, and the screen shows whichever one the developer happened to read.

**The question:** *Can this be computed instead of stored?* If yes, compute it.

**Why #8:** common and quietly wrong, but usually caught sooner than the items above.

**In the course:** Day 1 (signals and `computed`), Lab 2 "before" (the previous title showing after navigation).

## 9. Caches that never forget ⚠️

**Looks like:** `shareReplay(1)` on an HTTP call, or a store that loaded something once at startup, used as a cache with no idea of how old it may be.

**Why it hurts:** data that was right at 9 a.m. is still on screen at 4 p.m. Nothing refreshes it, because nothing decided when it should.

**The question:** *How stale is this allowed to be?* Minutes? Until the user comes back to the tab? Hours, for a list of branches? Write the answer down; then the code follows from it.

**Why #9:** the harm grows with how long the app stays open, and most apps stay open all day.

**In the course:** Day 1 (the state ledger's "how stale?" column), Lab 2 "after" (the branch list as a lookup table that's allowed to be old).

## 10. Apologies that overwrite

**Looks like:** an optimistic update that, on failure, restores the list as it was before the change.

**Why it hurts:** anything else that changed in the meantime is wiped out. The apology for one mistake causes another, and the user sees an item silently reappear with no explanation.

**The question:** *When the guess is wrong, what does the user see, and what do we say?* Keep guesses separate from the server's data, so undoing a guess never touches anything else. If you can't describe the apology, you haven't earned the guess.

**Why #10:** serious when it happens, but only teams already doing optimistic updates can make it.

**In the course:** Day 3 (the outbox: guesses kept apart from memory).

---

## Also seen

- **Loading, error, and data as separate fields** that can disagree (loading *and* an error at once). Use one status value.
- **Filter, sort, and page state outside the URL.** Lost on refresh, impossible to share.
- **Polling with `setInterval`** that's never cleaned up, or that stops working in a background tab.
- **Fetching a lookup table every time a list is opened.** Empty flashes, wasted requests, flaky tests.

---

## This list is a memory, too

Everything an app holds from somewhere else describes the past, and so does this list. It was written on October 15, 2026, for an Angular state management course: drafted with Claude (Opus 5.5), which has read a great deal of code, good and bad; the ranking criteria, and the rule that demonstrability doesn't get a vote, came from the instructor, Jeff Gonzalez.

Treat it like any other memory: check it against now. Hand it to the assistant you use today and ask:

1. *"Does this still seem right to you? What would you add, remove, or reorder, and why? Disagree with it where you can."*
2. *"Look at this code. Am I doing any of these? For each one, show me the file and line, and what the user would see."*

Asking it to disagree, and to point at evidence, matters more than which model you ask. Agreement isn't proof, and a finding without a file and line is a guess.
