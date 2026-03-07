import { query } from '../db/db.js';

const SOURCE_BR = 'basketball_reference';

/**
 * Get player id by Basketball Reference sr_player_id. Returns null if not found.
 */
export async function getPlayerBySrId(srPlayerId) {
  try {
    const r = await query(
      'SELECT id FROM players WHERE sr_player_id = $1',
      [srPlayerId]
    );
    return r.rows.length > 0 ? r.rows[0].id : null;
  } catch (err) {
    console.error('[playerService] getPlayerBySrId error:', err.message);
    throw err;
  }
}

/**
 * Insert player into players table. Does not use ON CONFLICT so it works
 * whether or not there is a UNIQUE constraint on sr_player_id.
 * Checks for existing player first to avoid duplicates.
 */
export async function insertPlayer(data) {
  const {
    full_name,
    first_name,
    last_name,
    birth_date,
    birth_place,
    height_cm,
    weight_kg,
    position,
    nationality,
    sr_player_id,
  } = data;

  if (!sr_player_id) {
    console.error('[playerService] insertPlayer: sr_player_id is required');
    return null;
  }

  try {
    const existing = await query('SELECT id FROM players WHERE sr_player_id = $1', [sr_player_id]);
    if (existing.rows.length > 0) {
      const playerId = existing.rows[0].id;
      await query(
        `UPDATE players SET
          full_name = COALESCE($2, full_name), first_name = COALESCE($3, first_name), last_name = COALESCE($4, last_name),
          birth_date = COALESCE($5, birth_date), birth_place = COALESCE($6, birth_place),
          height_cm = COALESCE($7, height_cm), weight_kg = COALESCE($8, weight_kg),
          position = COALESCE($9, position), nationality = COALESCE($10, nationality)
         WHERE id = $1`,
        [
          playerId,
          full_name ?? null,
          first_name ?? null,
          last_name ?? null,
          birth_date ?? null,
          birth_place ?? null,
          height_cm ?? null,
          weight_kg ?? null,
          position ?? null,
          nationality ?? null,
        ]
      );
      await ensureExternalId(playerId, sr_player_id);
      return playerId;
    }

    const ins = await query(
      `INSERT INTO players (
        full_name, first_name, last_name, birth_date, birth_place,
        height_cm, weight_kg, position, nationality, sr_player_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        full_name ?? null,
        first_name ?? null,
        last_name ?? null,
        birth_date ?? null,
        birth_place ?? null,
        height_cm ?? null,
        weight_kg ?? null,
        position ?? null,
        nationality ?? null,
        sr_player_id,
      ]
    );
    const playerId = ins.rows[0].id;
    await ensureExternalId(playerId, sr_player_id);
    return playerId;
  } catch (err) {
    console.error('[playerService] insertPlayer error:', err.message);
    throw err;
  }
}

/**
 * Ensure player_external_ids row exists. Uses check-then-insert/update
 * so it works with or without a UNIQUE constraint on (player_id, source).
 */
async function ensureExternalId(playerId, srPlayerId) {
  const r = await query(
    'SELECT id FROM player_external_ids WHERE player_id = $1 AND source = $2',
    [playerId, SOURCE_BR]
  );
  if (r.rows.length > 0) {
    await query(
      'UPDATE player_external_ids SET external_id = $3 WHERE player_id = $1 AND source = $2',
      [playerId, SOURCE_BR, srPlayerId]
    );
  } else {
    await query(
      `INSERT INTO player_external_ids (player_id, source, external_id)
       VALUES ($1, $2, $3)`,
      [playerId, SOURCE_BR, srPlayerId]
    );
  }
}

/**
 * Ensure external_id row exists for existing player.
 */
export async function upsertExternalId(playerId, srPlayerId) {
  try {
    await ensureExternalId(playerId, srPlayerId);
  } catch (err) {
    console.error('[playerService] upsertExternalId error:', err.message);
    throw err;
  }
}

export default { getPlayerBySrId, insertPlayer, upsertExternalId };
