using Fisher;
using JasperFx.Events.Documents;

namespace Backend.Api.Holds;

/// <summary>
/// Other patrons' placed holds, so the wait lists match what the lab showed when holds were
/// mocked (Dune 7, Parable of the Sower 3, Beloved 2, Kindred 1). Seeded once.
/// </summary>
public class SeedHolds : IInitialData
{
    private static readonly (int TitleId, int Waiting)[] WaitLists = [(1001, 7), (1006, 3), (1010, 2), (1005, 1)];

    public async Task Populate(IDocumentStore store, CancellationToken cancellation)
    {
        await using var session = store.LightweightSession();
        if (await session.Query<Hold>().CountAsync(cancellation) > 0) return;

        var patron = 1101;
        var placedAt = new DateTimeOffset(2026, 9, 10, 14, 32, 10, TimeSpan.Zero);
        foreach (var (titleId, waiting) in WaitLists)
        {
            for (var i = 0; i < waiting; i++)
            {
                var id = Guid.CreateVersion7();
                var at = placedAt.AddDays(i * 2);
                session.Events.StartStream<Hold>(id,
                    new HoldRequested(id, $"P{patron++}", titleId, "CEN", at),
                    new HoldPlaced(id, at.AddMinutes(1)));
            }
        }
        await session.SaveChangesAsync(cancellation);
    }
}
