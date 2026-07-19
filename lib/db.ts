import postgres from 'postgres';

function getSafeUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || typeof url !== 'string' || !url.startsWith('postgres')) {
    return 'postgres://dummy:dummy@localhost:5432/dummy';
  }
  return url;
}

const sql = postgres(getSafeUrl(), {
  ssl: false,
  max: 10,
  idle_timeout: 20,
});

export default sql;