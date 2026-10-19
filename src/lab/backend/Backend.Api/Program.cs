using System.Text.Json;
using System.Text.Json.Serialization;
using Backend.Api.Branches;
using Backend.Api.Dev;
using Backend.Api.Holds;
using Fisher;
using JasperFx.Events.Daemon;
using JasperFx.Events.Projections;
using Scalar.AspNetCore;
using Wolverine;
using Wolverine.Fisher;
using Wolverine.Http;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFisher(options =>
    {
        options.Connection("Data Source=app.db");
        // the hold as it stands now, written in the same transaction as its events
        options.Projections.Snapshot<Hold>(SnapshotLifecycle.Inline);
        options.InitialData.Add(new SeedBranches());
        options.InitialData.Add(new SeedHolds());
    })
    .IntegrateWithWolverine()
    .ApplyAllDatabaseChangesOnStartup()
    .SeedInitialDataOnStartup()
    .AddAsyncDaemon(DaemonMode.Solo);

builder.Host.UseWolverine(opts =>
{
    // commit each handler's and endpoint's session (and its outbox) as one transaction
    opts.Policies.AutoApplyTransactions();
});
builder.Services.AddWolverineHttp();

// "status": "placed", not "status": 1
builder.Services.ConfigureHttpJsonOptions(json =>
    json.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));

// fans committed hold decisions out to open SSE connections (see Holds/HoldEvents.cs)
builder.Services.AddSingleton<HoldEventHub>();

// The API's only documentation, for students: /openapi/v1.json
builder.Services.AddOpenApi(options => options.AddDocumentTransformer((document, _, _) =>
{
    document.Info.Title = "Library API";
    document.Info.Description = "Holds, branches, and patron preferences for the course's library app.";
    return Task.CompletedTask;
}));

// The Angular dev servers: reference, lab, demo.
builder.Services.AddCors(cors => cors.AddDefaultPolicy(policy => policy
    .WithOrigins("http://localhost:4200", "http://localhost:4201", "http://localhost:4202")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .WithExposedHeaders("ETag", "Location")));

var app = builder.Build();

app.UseCors();
app.MapOpenApi();
// The same document, as a page to read and try: /scalar. The root redirects there, so
// `dotnet run` (which opens the browser at /) lands on the API's reference.
app.MapScalarApiReference(options => options.WithTitle("Library API"));
app.MapGet("/", () => Results.Redirect("/scalar")).ExcludeFromDescription();
app.MapWolverineEndpoints();
app.MapDevReset(); // Development only; see Dev/DevReset.cs
app.Run();
