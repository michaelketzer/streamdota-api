import { Watcher } from '@streamdota/shared-types';
import { getConn } from "../../loader/db";
import { RowDataPacket, OkPacket } from "mysql2";

export async function requireWatcher(twitchId: number, displayName: string, username: string, userId: number): Promise<Watcher> {
    const conn = await getConn();
    const [rows] = await conn.execute<Array<Watcher & RowDataPacket>>('SELECT id, twitch_id as twitchId, display_name as displayName, username, watchtime as watchTime FROM watchers WHERE user_id = ? AND twitch_id = ?', [userId, twitchId]);

    let insertId = 0;
    if(rows.length === 0) {
        [{insertId}] = await conn.execute<OkPacket>(
            'INSERT INTO watchers (id, user_id, twitch_id, display_name, username, watchtime) VALUES (NULL, ?, ?, ?, ?, 0)',
            [userId, twitchId, displayName, username]
        );
    }

    if(rows.length === 1 && rows[0].displayName !== displayName) {
        await conn.execute('UPDATE watchers SET display_name=?, username=? WHERE twitch_id=?', [displayName, username, twitchId]);
    }
    await conn.end();

    return rows.length === 0 ? {
        twitchId,
        displayName,
        username,
        id: insertId,
        watchTime: 0
    } : rows[0];
}