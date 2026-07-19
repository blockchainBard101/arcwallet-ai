import axios from 'axios';

async function main() {
  const url = 'http://localhost:3001/';
  console.log(`Testing rate limiter on ${url} by firing 110 requests...`);

  let successCount = 0;
  let rateLimitedCount = 0;
  let otherErrorCount = 0;

  const requests = Array.from({ length: 110 }).map(async (_, i) => {
    try {
      const res = await axios.get(url);
      if (res.status === 200) {
        successCount++;
      }
    } catch (err: any) {
      if (err.response && err.response.status === 429) {
        rateLimitedCount++;
      } else {
        otherErrorCount++;
      }
    }
  });

  await Promise.all(requests);

  console.log(`Test Finished.`);
  console.log(`Success requests: ${successCount}`);
  console.log(`Rate limited (429) requests: ${rateLimitedCount}`);
  console.log(`Other errors: ${otherErrorCount}`);

  if (rateLimitedCount > 0) {
    console.log('SUCCESS: Rate limiting is working and returning 429!');
  } else {
    console.error('FAILED: No requests were rate limited.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
