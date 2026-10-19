using System.Collections.Concurrent;
using System.Net.ServerSentEvents;
using System.Runtime.CompilerServices;
using System.Threading.Channels;
using Wolverine.Http;

namespace Backend.Api.Holds;

/*
  Server-Sent Events for hold decisions.

  The browser's outbox parks a hold in "received" when PUT /holds/{id} answers 202. This is
  the top rung of how it hears the outcome (progressive enhancement, see outbox.md in the course notes):
    1. a "check status" control   -> GET /holds/{id}
    2. check on focus / visibility -> the same GET, no button
    3. this stream                 -> the server says "decided"; the app calls resolve()
  Every rung ends in the same resolve(), so the stream is an enhancement, never a requirement.

  The path a decision takes:

    EvaluateHoldHandler (Wolverine, scheduled)
        appends HoldPlaced / HoldRejected   } one transaction: the events and the
        returns HoldDecided (cascading)      } outgoing message commit together
            |
            v  (Wolverine sends cascading messages only after the commit)
    HoldDecidedHandler
        hands it to HoldEventHub
            |
            v
    HoldEventHub: one bounded channel per open connection, grouped by patron
            |
            v
    GET /patrons/{patronId}/hold-events  -> Results.ServerSentEvents(...)

  NOTE (for "for real"): everything below the cascading message is in-memory and per-process.
  See HoldEventHub for what changes with more than one server.
*/

/// <summary>A hold was decided: placed or rejected.</summary>
// WHY a separate message (and not the HoldPlaced/HoldRejected events themselves): this is the
// integration-facing fact, shaped for the browser. The event store's events stay internal.
public record HoldDecided(Guid HoldId, string PatronId, int TitleId, HoldStatus Status, string? Reason);

/// <summary>
/// Fans hold decisions out to every connected browser for that patron.
/// </summary>
/// <remarks>
/// WHY one channel PER CONNECTION, not one shared channel: .NET channels have competing
/// readers. Each item is read by exactly one reader, so if two connections (two tabs, or two
/// patrons) read the same channel, they split the events between them and each tab misses
/// some. That's the classic bug in the simple examples. So each connection gets its own
/// channel, and Publish copies the decision into every channel for that patron.
///
/// WHY bounded, and WHY "complete the channel" when it's full: a connection that stops
/// reading (a frozen tab, a dead network that hasn't timed out yet) must not grow memory
/// forever. When a connection's channel is full we end that stream instead of dropping
/// events silently. The browser's EventSource reconnects on its own, and on (re)connect the
/// client re-checks what's pending (see the "subscribed" event below). A dropped event is
/// survivable; a silently dropped one isn't.
///
/// FOR REAL:
/// - Per-process. With more than one API instance, a decision handled on instance A must reach
///   connections held by instance B: a backplane (Wolverine to a broker every instance listens
///   to, Redis pub/sub, Postgres LISTEN/NOTIFY...). The hub's shape survives; Publish would be
///   fed by that broadcast instead of a local handler.
/// - No replay. A browser that was disconnected when a decision happened doesn't get it from
///   here. That's deliberate: the client's rule is "on (re)connect, re-check what's pending"
///   (GET /holds?patronId=), which is always correct and far simpler than Last-Event-ID replay
///   (replay needs a store of past events, a replay boundary taken under the same lock as
///   Publish, cursors checked against identity, and a "too old, resync" answer).
/// </remarks>
public sealed class HoldEventHub
{
    // patronId -> (connectionId -> that connection's channel)
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<Guid, Channel<HoldDecided>>> _byPatron = new();

    // Generous for a person's own holds. FOR REAL: size it against expected burst rate.
    private const int PerConnectionCapacity = 64;

    /// <summary>The stream for one connection. Ends when the client disconnects (cancellation).</summary>
    public async IAsyncEnumerable<SseItem<object>> Subscribe(
        string patronId,
        [EnumeratorCancellation] CancellationToken cancellation)
    {
        var channel = Channel.CreateBounded<HoldDecided>(new BoundedChannelOptions(PerConnectionCapacity)
        {
            SingleReader = true, // only this connection reads it
            SingleWriter = false, // decisions can arrive from any handler thread
        });

        var connectionId = Guid.NewGuid();
        var connections = _byPatron.GetOrAdd(patronId, _ => new());
        connections[connectionId] = channel;

        try
        {
            // WHY a first event: it tells the client "you're live; anything decided while you
            // were away is not coming down this pipe, so re-check now." On every reconnect the
            // client gets this again, which makes "refetch on reconnect" automatic and exact.
            // (It also makes EventSource's onopen fire promptly, before any decision exists.)
            yield return new SseItem<object>(new { patronId }, "subscribed");

            await foreach (var decision in channel.Reader.ReadAllAsync(cancellation))
            {
                // No EventId: there is no replay (see remarks), so an id would promise a resume
                // the server can't keep. FOR REAL with replay: EventId = a durable sequence.
                yield return new SseItem<object>(decision, "hold-decided");
            }
        }
        finally
        {
            // Runs when the client disconnects (cancellation) or the channel was completed.
            connections.TryRemove(connectionId, out _);
            // Leaving an empty inner dictionary behind is harmless here.
            // FOR REAL: remove the patron's entry when it empties (carefully: racing a new subscriber).
        }
    }

    /// <summary>Copies a decision to every open connection for its patron.</summary>
    public void Publish(HoldDecided decision)
    {
        if (!_byPatron.TryGetValue(decision.PatronId, out var connections)) return; // nobody listening

        foreach (var channel in connections.Values)
        {
            if (!channel.Writer.TryWrite(decision))
            {
                // Full: this connection isn't keeping up. End its stream; the browser reconnects
                // and re-checks (see remarks). Better than unbounded memory or silent loss.
                channel.Writer.TryComplete();
            }
        }
    }
}

/// <summary>Hands committed decisions to the hub.</summary>
// WHY a Wolverine handler (and not calling the hub from EvaluateHoldHandler directly):
// calling it directly would push "placed" to the browser BEFORE the transaction commits, and
// if the commit then failed, the browser would believe something the server never recorded.
// As a cascading message, this only runs after the decision is durable. The browser can never
// hear about a decision that didn't happen.
public static class HoldDecidedHandler
{
    public static void Handle(HoldDecided decision, HoldEventHub hub) => hub.Publish(decision);
}

[Tags("Holds")]
public static class HoldEventEndpoints
{
    /// <summary>
    /// A stream of the patron's hold decisions (Server-Sent Events). The first event,
    /// "subscribed", means: re-check pending holds now. Then one "hold-decided" event per
    /// decision. Reconnects are automatic in the browser (EventSource).
    /// </summary>
    // FOR REAL: the patron comes from the authenticated user (a cookie via the BFF), never the
    // path. EventSource can't send an Authorization header, which is one more reason the
    // cookie-based BFF is where this ends up.
    // FOR REAL: proxies and load balancers may buffer or time out idle streams. Consider a
    // periodic heartbeat (a comment line) and disable response buffering/compression for this
    // route.
    [WolverineGet("/patrons/{patronId}/hold-events")]
    public static IResult Get(string patronId, HoldEventHub hub, CancellationToken cancellation) =>
        Results.ServerSentEvents(hub.Subscribe(patronId, cancellation));
}
