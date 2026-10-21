// npm run api:reset — start the API's data over (every hold, every preference), then re-seed.
// Works only while the API runs in Development, which is what `dotnet run` does.
const url = 'http://localhost:5261/dev/reset';

try {
  const response = await fetch(url, { method: 'POST' });
  if (response.ok) {
    console.log('API data reset: no holds for P0042, seeded wait lists and branches restored.');
  } else if (response.status === 404) {
    console.error('The API is running, but not in Development, so it has no reset. Start it with `dotnet run`.');
    process.exitCode = 1;
  } else {
    console.error(`Reset failed: ${response.status} ${response.statusText}`);
    process.exitCode = 1;
  }
} catch {
  console.error(`Couldn't reach the API at ${url}. Is it running? (cd src/Backend/Backend.Api && dotnet run)`);
  process.exitCode = 1;
}
