// The only way in: the renderer has no network to the outside, so this passes the browser's connections through to it.
// It has no project files and no other job.
import { connect, createServer } from 'node:net';

const port = Number(process.env.ORBITO_PORT ?? 5190);
const upstream = process.env.ORBITO_UPSTREAM ?? 'renderer';

createServer((client) => {
  const server = connect(port, upstream);
  const close = () => {
    client.destroy();
    server.destroy();
  };

  client.on('error', close).on('close', close);
  server.on('error', close).on('close', close);
  client.pipe(server).pipe(client);
}).listen(port, '0.0.0.0');
