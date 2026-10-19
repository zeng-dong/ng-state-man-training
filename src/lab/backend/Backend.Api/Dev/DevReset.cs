using Backend.Api.Branches;
using Backend.Api.Holds;
using Fisher;

namespace Backend.Api.Dev;

/// <summary>
/// POST /dev/reset: start the course's data over, without knowing any .NET.
/// From the frontend folder: <c>npm run api:reset</c>.
/// </summary>
/// <remarks>
/// WHY: students need to start a lab over (P0042 hits the three-hold limit fast), and
/// "stop the API, delete app.db, start it again" asks them to know where the API lives
/// and how to run it.
///
/// FOR REAL: an endpoint that deletes everything is a loaded gun. This one is only mapped
/// in Development (the default for <c>dotnet run</c>, from launchSettings.json), so a build
/// running anywhere else doesn't have it at all. It's a minimal API on purpose, not a
/// Wolverine endpoint, so that the check below is the only thing that decides whether it
/// exists.
/// </remarks>
public static class DevReset
{
    public static void MapDevReset(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment()) return;

        app.MapPost("/dev/reset", async (IDocumentStore store, CancellationToken cancellation) =>
            {
                // Deletes every document and event, keeping the schema, and pauses the async
                // daemon around the wipe (a wipe under a running daemon strands it).
                await store.Advanced.ResetAllDataAsync(cancellation);

                // Then the same seed data as a fresh start.
                await new SeedBranches().Populate(store, cancellation);
                await new SeedHolds().Populate(store, cancellation);
                return Results.NoContent();
            })
            .WithSummary("Development only: delete all data and re-seed.")
            .ExcludeFromDescription(); // not part of the API students read about
    }
}
