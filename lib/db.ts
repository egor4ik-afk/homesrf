import postgres from 'postgres';

// Гарантирует валидный URL на этапе сборки, даже если DATABASE_URL ещё не задан
function getSafeUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || typeof url !== 'string' || !url.startsWith('postgres')) {
    return 'postgres://dummy:dummy@localhost:5432/dummy';
  }
  return url;
}

const sql = postgres(getSafeUrl(), {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
});

export default sql;
