using Fisher;
using JasperFx.Events.Documents;
using Wolverine.Http;

namespace Backend.Api.Branches;

/// <summary>A library branch. Reference data: it changes maybe once a year.</summary>
public class Branch
{
    /// <summary>The branch code, e.g. "NOR".</summary>
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public bool IsOpen { get; set; }
}

[Tags("Branches")]
public static class BranchEndpoints
{
    // The first real request in the course: small, boring, and a good place to ask
    // what happens when it fails, comes back empty, or has a thousand rows.
    /// <summary>All library branches, by name.</summary>
    [WolverineGet("/branches")]
    public static Task<IReadOnlyList<Branch>> List(IQuerySession session) =>
        session.Query<Branch>().OrderBy(b => b.Name).ToListAsync();
}

/// <summary>The same four branches the lab's mocks know about, seeded once.</summary>
public class SeedBranches : IInitialData
{
    public async Task Populate(IDocumentStore store, CancellationToken cancellation)
    {
        await using var session = store.LightweightSession();
        session.Store(
            new Branch { Id = "CEN", Name = "Central Library", IsOpen = true },
            new Branch { Id = "NOR", Name = "Northside Branch", IsOpen = true },
            new Branch { Id = "RIV", Name = "Riverside Branch", IsOpen = true },
            new Branch { Id = "OAK", Name = "Oak Hill Branch", IsOpen = false });
        await session.SaveChangesAsync(cancellation);
    }
}
