import server from './app';
import config from './config/config';

const { PORT, NODE_ENV } = config.env;
async function main() {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

main();
