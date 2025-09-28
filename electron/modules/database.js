const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const log = require('electron-log');

const DB_PATH = path.join(app.getPath('userData'), 'library.db');
let db;

function initDatabase() {
    try {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        log.info('[Database] База данных успешно инициализирована.');
        createSchema();
    } catch (error) {
        log.error('[Database] Не удалось инициализировать базу данных:', error);
    }
}

function createSchema() {
    const sql = `
    CREATE TABLE IF NOT EXISTS tracks (
        uuid TEXT PRIMARY KEY,
        filePath TEXT NOT NULL,
        originalPath TEXT NOT NULL UNIQUE,
        title TEXT,
        artist TEXT,
        album TEXT,
        duration REAL,
        artwork TEXT,
        isLocal INTEGER DEFAULT 1,
        lastModified INTEGER NOT NULL 
    );
    CREATE INDEX IF NOT EXISTS idx_artist ON tracks(artist);
    CREATE INDEX IF NOT EXISTS idx_album ON tracks(album);
    `;
    db.exec(sql);
    log.info('[Database] Схема проверена/создана.');
}


function getAllTracks() {
    const stmt = db.prepare('SELECT * FROM tracks ORDER BY artist, album, title');
    return stmt.all();
}

function getAllTrackPathsAndMtimes() {
    const stmt = db.prepare('SELECT originalPath, lastModified FROM tracks');
    const map = new Map();
    for (const row of stmt.iterate()) {
        map.set(row.originalPath, row.lastModified);
    }
    return map;
}



function addTracks(tracks) {
    if (!tracks || tracks.length === 0) return;

    const insert = db.prepare(`
        INSERT OR REPLACE INTO tracks 
        (uuid, filePath, originalPath, title, artist, album, duration, artwork, isLocal, lastModified) 
        VALUES (@uuid, @filePath, @originalPath, @title, @artist, @album, @duration, @artwork, @isLocal, @lastModified)
    `);

    db.transaction((items) => {
        for (const item of items) {
            insert.run(item);
        }
    })(tracks);

    log.info(`[Database] Добавлено/обновлено ${tracks.length} треков.`);
}

function removeTracks(originalPaths) {
     if (!originalPaths || originalPaths.length === 0) return;

    const del = db.prepare('DELETE FROM tracks WHERE originalPath = ?');
    
    db.transaction((paths) => {
        for (const p of paths) {
            del.run(p);
        }
    })(originalPaths);
    log.info(`[Database] Удалено ${originalPaths.length} треков.`);
}


function closeDatabase() {
    if (db) {
        db.close();
        log.info('[Database] Соединение с базой данных закрыто.');
    }
}

module.exports = {
    initDatabase,
    closeDatabase,
    getAllTracks,
    getAllTrackPathsAndMtimes,
    addTracks,
    removeTracks,
};