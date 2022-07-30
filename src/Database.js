export async function initializeDatabase(db, settings) {
    try {
        const conn = await db.getConnection();
        if (conn) {
            console.log('Database Connected successfully.');
            setupDebugging(db, settings);
            conn.release();
            return;
        }
    } catch (err) {
        if (!err.code) throw new Error(err);

        switch (err.code) {
            case 'PROTOCOL_CONNECTION_LOST':
                throw new Error('Database connection was closed.');
            case 'ER_CON_COUNT_ERROR':
                throw new Error('Database has too many connections.');
            case 'ECONNREFUSED':
                throw new Error('Check your connection details (packages/template/settings.json) or make sure your MySQL server is running.');
            case 'ER_BAD_DB_ERROR':
                throw new Error('The database name you\'ve entered does not exist. Ensure the details inside your config file are correct (packages/template/config.json).');
            case 'ER_ACCESS_DENIED_ERROR':
                throw new Error('Check your MySQL username and password and make sure they\'re correct.');
            case 'ENOENT':
                throw new Error('There is no internet connection. Check your connection and try again.');
            case 'ENOTFOUND':
                throw new Error('Database host not found.');
            default:
                throw new Error(err);
        }
    }
}
function setupDebugging(db, settings) {
    if (settings.db_debug) {
        //  Acquire - a connection is acquired from the pool.
        db.on('acquire', function (connection) {
            console.log(`Connection ${connection.threadId} acquired`);
        });

        // Connection - a new connection is made within the pool.
        db.on('connection', function (connection) {
            console.log(`New connection made on ${connection.threadId}`)
        });

        //  Enqueue - a callback has been queued to wait for an available connection.
        db.on('enqueue', function () {
            console.log(`${'[WARNING] You have hit the database connection limit and queries are waiting to be executed.'}`);
        });

        //  Release - a connection is released back to the pool.
        db.on('release', function (connection) {
            console.log(`Connection ${connection.threadId} released`);
        });
    }
}