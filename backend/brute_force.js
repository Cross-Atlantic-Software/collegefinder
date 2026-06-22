const { Client } = require('pg');

const passwords = ['postgres', 'root', 'admin', 'password', '123456', '1234', '12345678', '', 'shahidmollick', 'UT_ua@2026', 'ekxkwvbrlmwprxbq'];

async function main() {
  for (let pass of passwords) {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'collegefinder_db',
      user: 'postgres',
      password: pass,
    });
    try {
      await client.connect();
      console.log('SUCCESS with password:', pass);
      await client.end();
      return pass;
    } catch (err) {
      console.log('Failed:', pass, err.message);
    }
  }
}
main();
