using Fisher;
using Microsoft.AspNetCore.Mvc;
using JasperFx;
using Wolverine.Http;

namespace Backend.Api.Prefs;

// Step 3 of the prefs ladder: the server owns them, the browser's copy is a memory,
// and saving is an intent.
/// <summary>A patron's preferences.</summary>
public class PatronPrefs : IRevisioned
{
    /// <summary>The patron id, e.g. "P0042".</summary>
    public string Id { get; set; } = "";
    /// <summary>Numeric revision; sent as the ETag. 0 means never saved.</summary>
    public int Version { get; set; }
    public string? HomeBranch { get; set; }
    public bool HideReviews { get; set; }
}

public record SavePrefs(string? HomeBranch, bool HideReviews);

[Tags("Patron preferences")]
public static class PrefsEndpoints
{
    /// <summary>A patron who has never saved anything gets the defaults (and ETag "0").</summary>
    [WolverineGet("/patrons/{patronId}/prefs")]
    public static async Task<PatronPrefs> Get(string patronId, IQuerySession session, HttpResponse response)
    {
        var prefs = await session.LoadAsync<PatronPrefs>(patronId) ?? new PatronPrefs { Id = patronId };
        response.Headers.ETag = $"\"{prefs.Version}\"";
        return prefs;
    }

    // A 412 means the client owes the user an apology ("these changed on another device")
    // instead of a silent overwrite.
    /// <summary>
    /// Replaces the patron's prefs. With If-Match, the save only succeeds if nobody has saved
    /// since that version; otherwise 412 Precondition Failed. Without If-Match, the last save wins.
    /// </summary>
    [WolverinePut("/patrons/{patronId}/prefs")]
    [ProducesResponseType<PatronPrefs>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status412PreconditionFailed)]
    public static async Task<IResult> Put(
        string patronId,
        SavePrefs request,
        IDocumentSession session,
        HttpRequest http,
        HttpResponse response)
    {
        var current = await session.LoadAsync<PatronPrefs>(patronId);
        var currentVersion = current?.Version ?? 0;

        var ifMatch = http.Headers.IfMatch.ToString().Trim('"');
        if (ifMatch.Length > 0 && ifMatch != currentVersion.ToString())
            return PreconditionFailed(currentVersion, response);

        var prefs = new PatronPrefs { Id = patronId, HomeBranch = request.HomeBranch, HideReviews = request.HideReviews };
        // the stored revision must still be below the next one: closes the race between
        // the check above and the write
        session.Store(prefs, currentVersion + 1);
        try
        {
            await session.SaveChangesAsync();
        }
        catch (ConcurrencyException)
        {
            return PreconditionFailed(currentVersion, response);
        }

        var saved = await session.LoadAsync<PatronPrefs>(patronId);
        response.Headers.ETag = $"\"{saved!.Version}\"";
        return Results.Ok(saved);
    }

    private static IResult PreconditionFailed(int currentVersion, HttpResponse response)
    {
        response.Headers.ETag = $"\"{currentVersion}\"";
        return Results.Problem(
            detail: "These preferences changed since you loaded them.",
            statusCode: StatusCodes.Status412PreconditionFailed);
    }
}
