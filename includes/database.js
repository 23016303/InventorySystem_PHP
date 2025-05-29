const mysql = require('mysql2/promise');
const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = require('./config.js');

class MySqli_DB {
    constructor() {
        this.con = null;
        this.query_id = null;
        this.db_connect();
    }

    /*--------------------------------------------------------------*/
    /* Function for Open database connection
    /*--------------------------------------------------------------*/
    async db_connect() {
        try {
            this.con = await mysql.createConnection({
                host: DB_HOST,
                user: DB_USER,
                password: DB_PASS,
                database: DB_NAME
            });
        } catch (error) {
            throw new Error(" Database connection failed: " + error.message);
        }
    }

    /*--------------------------------------------------------------*/
    /* Function for Close database connection
    /*--------------------------------------------------------------*/
    async db_disconnect() {
        if (this.con) {
            await this.con.end();
            this.con = null;
        }
    }

    /*--------------------------------------------------------------*/
    /* Function for mysqli query
    /*--------------------------------------------------------------*/
    async query(sql) {
        if (sql.trim() !== "") {
            try {
                const [rows, fields] = await this.con.execute(sql);
                this.query_id = { rows, fields, insertId: this.con.connection.insertId, affectedRows: this.con.connection.affectedRows };
                return this.query_id;
            } catch (error) {
                // only for Develope mode
                throw new Error("Error on this Query :<pre> " + sql + "</pre>");
                // For production mode
                // throw new Error("Error on Query");
            }
        }
        return null;
    }

    /*--------------------------------------------------------------*/
    /* Function for Query Helper
    /*--------------------------------------------------------------*/
    fetch_array(statement) {
        if (statement && statement.rows && statement.rows.length > 0) {
            return statement.rows.shift();
        }
        return null;
    }

    fetch_object(statement) {
        if (statement && statement.rows && statement.rows.length > 0) {
            return statement.rows.shift();
        }
        return null;
    }

    fetch_assoc(statement) {
        if (statement && statement.rows && statement.rows.length > 0) {
            return statement.rows.shift();
        }
        return null;
    }

    num_rows(statement) {
        if (statement && statement.rows) {
            return statement.rows.length;
        }
        return 0;
    }

    insert_id() {
        return this.con.connection.insertId || 0;
    }

    affected_rows() {
        return this.con.connection.affectedRows || 0;
    }

    /*--------------------------------------------------------------*/
    /* Function for Remove escapes special
    /* characters in a string for use in an SQL statement
    /*--------------------------------------------------------------*/
    escape(str) {
        return mysql.escape(str).slice(1, -1); // Remove surrounding quotes
    }

    /*--------------------------------------------------------------*/
    /* Function for while loop
    /*--------------------------------------------------------------*/
    while_loop(loop) {
        const results = [];
        if (loop && loop.rows) {
            while (loop.rows.length > 0) {
                const result = this.fetch_array(loop);
                if (result) {
                    results.push(result);
                } else {
                    break;
                }
            }
        }
        return results;
    }
}

const db = new MySqli_DB();

module.exports = { MySqli_DB, db };