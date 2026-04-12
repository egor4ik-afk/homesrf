import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: 5,
  idle_timeout: 20,
  connect_timeout: 15,
  connection: {
    application_name: 'homesrf',
  },
})

export default sql