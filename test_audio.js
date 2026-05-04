const https = require('https');

https.get('https://cdn.pixabay.com/download/audio/2022/03/15/audio_3479c65d5f.mp3?filename=future-bass-11038.mp3', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
}).on('error', (e) => {
  console.error(e);
});
