import express from 'express';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
const app = express();
const PORT = process.env.PORT || 3000;
app.use('/assets', express.static(fileURLToPath(new URL('./dist/assets/', import.meta.url)), {
  maxAge: '1y',
  immutable: true,
  fallthrough: false,
}));
app.use(express.static(fileURLToPath(new URL('./dist/', import.meta.url)), {
  setHeaders(response) {
    response.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  },
}));
app.listen(PORT, () => console.log('Server running on port 3000'));
