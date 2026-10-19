using Fisher;
using Microsoft.AspNetCore.Mvc;
using JasperFx.Events.Documents;
using Wolverine;
using Wolverine.Http;

namespace Backend.Api.Holds;

/// <summary>The body of PUT /holds/{id}. The id is the client's: it is also the idempotency key.</summary>
public record PlaceHold(string PatronId, int TitleId, string BranchCode);

/// <summary>Sent (scheduled) when a hold is requested; decides it.</summary>
public record EvaluateHold(Guid HoldId);

[Tags("Holds")]
public static class HoldEndpoints
{
    /// <summary>
    /// Request a hold under a client-generated id. Safe to repeat: the same id and body
    /// return the hold as it is now (202 while requested, 200 once decided); the same id
    /// with a different body is a 409.
    /// </summary>
    [WolverinePut("/holds/{id}")]
    [ProducesResponseType<Hold>(StatusCodes.Status202Accepted)]
    [ProducesResponseType<Hold>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public static async Task<IResult> Put(
        Guid id,
        PlaceHold request,
        IDocumentSession session,
        IMessageBus bus,
        IConfiguration config,
        HttpResponse response)
    {
        var existing = await session.Events.FetchLatest<Hold>(id);
        if (existing is not null)
        {
            var same = existing.PatronId == request.PatronId
                       && existing.TitleId == request.TitleId
                       && existing.BranchCode == request.BranchCode;
            if (!same)
                return Results.Problem(
                    detail: "A different hold already exists with this id.",
                    statusCode: StatusCodes.Status409Conflict);

            response.Headers.ETag = ETagFor(existing);
            return existing.Status == HoldStatus.Requested
                ? Results.Accepted($"/holds/{id}", existing)
                : Results.Ok(existing);
        }

        var requested = new HoldRequested(id, request.PatronId, request.TitleId, request.BranchCode, DateTimeOffset.UtcNow);
        session.Events.StartStream<Hold>(id, requested);

        // Enlisted in the same transaction as the event (Wolverine's outbox): the hold can't
        // be stuck in "requested" because the decision message was lost between two writes.
        var delay = TimeSpan.FromSeconds(config.GetValue("Holds:DecisionDelaySeconds", 3));
        await bus.ScheduleAsync(new EvaluateHold(id), delay);

        var hold = Hold.Create(requested);
        hold.Version = 1;
        response.Headers.ETag = ETagFor(hold);
        return Results.Accepted($"/holds/{id}", hold);
    }

    /// <summary>One hold. Its version is sent as the ETag.</summary>
    [WolverineGet("/holds/{id}")]
    [ProducesResponseType<Hold>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public static async Task<IResult> Get(Guid id, IQuerySession session, HttpResponse response)
    {
        var hold = await session.Events.FetchLatest<Hold>(id);
        if (hold is null) return Results.NotFound();
        response.Headers.ETag = ETagFor(hold);
        return Results.Ok(hold);
    }

    /// <summary>
    /// Cancel a hold, requested or placed. Safe to repeat: cancelling a cancelled hold is
    /// still a 204. A rejected hold was never placed, so there's nothing to cancel (409).
    /// To confirm, GET /holds/{id}: its status is "cancelled".
    /// </summary>
    [WolverineDelete("/holds/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public static async Task<IResult> Cancel(Guid id, IDocumentSession session)
    {
        var hold = await session.Events.FetchLatest<Hold>(id);
        if (hold is null) return Results.NotFound();
        if (hold.Status == HoldStatus.Cancelled) return Results.NoContent();
        if (hold.Status == HoldStatus.Rejected)
            return Results.Problem(
                detail: "This hold was never placed, so there's nothing to cancel.",
                statusCode: StatusCodes.Status409Conflict);

        // If the decision hasn't run yet, it will find the hold cancelled and leave it alone.
        session.Events.Append(id, new HoldCancelled(id, DateTimeOffset.UtcNow));
        return Results.NoContent();
    }

    /// <summary>
    /// Holds for a patron (?patronId=) or a title's wait list (?titleId=), or both.
    /// Cancelled holds aren't listed.
    /// </summary>
    [WolverineGet("/holds")]
    public static Task<IReadOnlyList<Hold>> List(string? patronId, int? titleId, IQuerySession session)
    {
        var query = session.Query<Hold>().Where(h => h.Status != HoldStatus.Cancelled);
        if (patronId is not null) query = query.Where(h => h.PatronId == patronId);
        if (titleId is not null) query = query.Where(h => h.TitleId == titleId);
        return query.OrderBy(h => h.RequestedAt).ToListAsync();
    }

    private static string ETagFor(Hold hold) => $"\"{hold.Version}\"";
}

public static class EvaluateHoldHandler
{
    /// <summary>The library's rule, deliberately simple: at most this many active holds per patron.</summary>
    public const int HoldLimit = 3;

    // Returns HoldDecided as a cascading message: Wolverine sends it only after this handler's
    // transaction (the decision event) commits. See HoldEvents.cs for where it goes.
    public static async Task<HoldDecided?> Handle(EvaluateHold command, IDocumentSession session)
    {
        var hold = await session.Events.FetchLatest<Hold>(command.HoldId);
        if (hold is null || hold.Status != HoldStatus.Requested) return null; // already decided (redelivery)

        var activeOthers = await session.Query<Hold>()
            .Where(h => h.PatronId == hold.PatronId && h.Id != hold.Id && h.Status == HoldStatus.Placed)
            .CountAsync();

        object decision = activeOthers >= HoldLimit
            ? new HoldRejected(hold.Id, $"You already have {HoldLimit} holds, the limit.", DateTimeOffset.UtcNow)
            : new HoldPlaced(hold.Id, DateTimeOffset.UtcNow);

        session.Events.Append(hold.Id, decision);

        return decision is HoldRejected rejected
            ? new HoldDecided(hold.Id, hold.PatronId, hold.TitleId, HoldStatus.Rejected, rejected.Reason)
            : new HoldDecided(hold.Id, hold.PatronId, hold.TitleId, HoldStatus.Placed, null);
    }
}
