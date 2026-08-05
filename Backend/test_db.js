// test_db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'student_attendance_system' // Ensure this matches your actual database name
        });

        console.log('✅ Connection established successfully!');

        // Let's perform a "Join" query to ensure your tables are linked correctly
        const [rows] = await connection.execute('SHOW TABLES');
        console.log('Tables found in database:', rows.map(r => Object.values(r)[0]));

        await connection.end();
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    }
}

testConnection();

