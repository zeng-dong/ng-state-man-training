using JasperFx;

namespace Backend.Api.Holds;

// What happened to a hold. A hold is requested, then decided later: placed or rejected.
// The patron can cancel it at any point before it is rejected.
public record HoldRequested(Guid HoldId, string PatronId, int TitleId, string BranchCode, DateTimeOffset RequestedAt);
public record HoldPlaced(Guid HoldId, DateTimeOffset PlacedAt);
public record HoldRejected(Guid HoldId, string Reason, DateTimeOffset RejectedAt);
public record HoldCancelled(Guid HoldId, DateTimeOffset CancelledAt);

public enum HoldStatus { Requested, Placed, Rejected, Cancelled }

// Built from its events, and snapshotted inline so it can be queried.
/// <summary>A hold as it stands now.</summary>
public class Hold : IRevisioned
{
    public Guid Id { get; set; }
    // IRevisioned: a projected document's revision is its stream version.
    /// <summary>The hold's version. Sent as the ETag; send it back as If-Match.</summary>
    public int Version { get; set; }
    public string PatronId { get; set; } = "";
    public int TitleId { get; set; }
    public string BranchCode { get; set; } = "";
    public HoldStatus Status { get; set; }
    public string? Reason { get; set; }
    public DateTimeOffset RequestedAt { get; set; }
    public DateTimeOffset? DecidedAt { get; set; }

    public static Hold Create(HoldRequested e) => new()
    {
        Id = e.HoldId,
        PatronId = e.PatronId,
        TitleId = e.TitleId,
        BranchCode = e.BranchCode,
        Status = HoldStatus.Requested,
        RequestedAt = e.RequestedAt,
    };

    public void Apply(HoldPlaced e)
    {
        Status = HoldStatus.Placed;
        DecidedAt = e.PlacedAt;
    }

    public void Apply(HoldRejected e)
    {
        Status = HoldStatus.Rejected;
        Reason = e.Reason;
        DecidedAt = e.RejectedAt;
    }

    public void Apply(HoldCancelled e)
    {
        Status = HoldStatus.Cancelled;
        DecidedAt = e.CancelledAt;
    }
}
