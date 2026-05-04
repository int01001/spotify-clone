const https = require('https');

https.get('https://itunes.apple.com/search?term=top+songs&entity=song&limit=1', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    console.log(JSON.parse(data).results[0]);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
