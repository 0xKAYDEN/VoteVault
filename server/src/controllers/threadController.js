import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import logger from '../utils/logger.js';

const PAGE_SIZE = 20;

// ─── Categories ───────────────────────────────────────────────────────────────

export const getCategories = async (req, res) => {
  try {
    const [cats] = await db.query(
      `SELECT tc.*,
         (SELECT COUNT(*) FROM threads t WHERE t.category_id = tc.id AND t.is_deleted = FALSE) AS thread_count
       FROM thread_categories tc
       WHERE tc.is_active = TRUE
       ORDER BY tc.display_order ASC`
    );
    res.json(cats);
  } catch (err) {
    logger.error('getCategories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// ─── Threads ──────────────────────────────────────────────────────────────────

export const getThreads = async (req, res) => {
  try {
    const { category, page = 1, search, author } = req.query;
    const offset = (Number(page) - 1) * PAGE_SIZE;
    const params = [];

    let where = 't.is_deleted = FALSE';
    if (category) { where += ' AND tc.slug = ?'; params.push(category); }
    if (search)   { where += ' AND (t.title LIKE ? OR t.body LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (author)   { where += ' AND t.author_id = ?'; params.push(author); }

    const [threads] = await db.query(
      `SELECT t.id, t.public_id, t.author_id, t.title, t.body, t.is_pinned, t.is_locked,
              t.view_count, t.reply_count, t.last_reply_at, t.created_at,
              tc.name AS category_name, tc.slug AS category_slug, tc.icon AS category_icon,
              p.username AS author_username, p.display_name AS author_display_name,
              p.avatar_url AS author_avatar,
              lp.username AS last_reply_username
       FROM threads t
       JOIN thread_categories tc ON t.category_id = tc.id
       JOIN profiles p ON t.author_id = p.id
       LEFT JOIN profiles lp ON t.last_reply_user_id = lp.id
       WHERE ${where}
       ORDER BY t.is_pinned DESC, t.last_reply_at DESC
       LIMIT ? OFFSET ?`,
      [...params, PAGE_SIZE, offset]
    );

    const [total] = await db.query(
      `SELECT COUNT(*) AS count FROM threads t
       JOIN thread_categories tc ON t.category_id = tc.id
       WHERE ${where}`,
      params
    );

    res.json({ threads, total: total[0].count, page: Number(page), pageSize: PAGE_SIZE });
  } catch (err) {
    logger.error('getThreads error:', err);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
};

export const getThread = async (req, res) => {
  try {
    const { publicId } = req.params;

    const [rows] = await db.query(
      `SELECT t.*, tc.name AS category_name, tc.slug AS category_slug, tc.icon AS category_icon,
              p.username AS author_username, p.display_name AS author_display_name,
              p.avatar_url AS author_avatar,
              (SELECT GROUP_CONCAT(role) FROM user_roles WHERE user_id = t.author_id) AS author_roles
       FROM threads t
       JOIN thread_categories tc ON t.category_id = tc.id
       JOIN profiles p ON t.author_id = p.id
       WHERE t.public_id = ? AND t.is_deleted = FALSE`,
      [publicId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Thread not found' });

    const thread = rows[0];
    thread.author_roles = thread.author_roles ? thread.author_roles.split(',') : [];

    // Increment view count
    await db.query('UPDATE threads SET view_count = view_count + 1 WHERE public_id = ?', [publicId]);

    // Get reactions for thread
    const [reactions] = await db.query(
      `SELECT reaction, COUNT(*) AS count FROM thread_reactions
       WHERE target_type = 'thread' AND target_id = ?
       GROUP BY reaction`,
      [thread.id]
    );
    thread.reactions = reactions;

    // Get user's own reaction if authenticated
    if (req.user) {
      const [myReaction] = await db.query(
        `SELECT reaction FROM thread_reactions
         WHERE user_id = ? AND target_type = 'thread' AND target_id = ?`,
        [req.user.id, thread.id]
      );
      thread.my_reaction = myReaction[0]?.reaction || null;
    }

    res.json(thread);
  } catch (err) {
    logger.error('getThread error:', err);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
};

export const createThread = async (req, res) => {
  try {
    const { category_id, title, body } = req.body;
    const author_id = req.user.id;

    if (!title?.trim() || !body?.trim() || !category_id) {
      return res.status(400).json({ error: 'category_id, title, and body are required' });
    }
    if (title.length > 255) return res.status(400).json({ error: 'Title too long (max 255)' });
    if (body.length > 20000) return res.status(400).json({ error: 'Body too long (max 20000 chars)' });

    const public_id = uuidv4();
    await db.query(
      `INSERT INTO threads (public_id, category_id, author_id, title, body)
       VALUES (?, ?, ?, ?, ?)`,
      [public_id, category_id, author_id, title.trim(), body.trim()]
    );

    res.status(201).json({ public_id, message: 'Thread created' });
  } catch (err) {
    logger.error('createThread error:', err);
    res.status(500).json({ error: 'Failed to create thread' });
  }
};

export const updateThread = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { title, body } = req.body;
    const userId = req.user.id;

    const [rows] = await db.query(
      'SELECT id, author_id FROM threads WHERE public_id = ? AND is_deleted = FALSE',
      [publicId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Thread not found' });

    // Only author or admin can edit
    const [roles] = await db.query('SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"', [userId]);
    if (rows[0].author_id !== userId && !roles.length) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query(
      'UPDATE threads SET title = COALESCE(?, title), body = COALESCE(?, body) WHERE public_id = ?',
      [title?.trim() || null, body?.trim() || null, publicId]
    );
    res.json({ message: 'Thread updated' });
  } catch (err) {
    logger.error('updateThread error:', err);
    res.status(500).json({ error: 'Failed to update thread' });
  }
};

export const deleteThread = async (req, res) => {
  try {
    const { publicId } = req.params;
    const userId = req.user.id;

    const [rows] = await db.query('SELECT id, author_id FROM threads WHERE public_id = ?', [publicId]);
    if (!rows.length) return res.status(404).json({ error: 'Thread not found' });

    const [roles] = await db.query('SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"', [userId]);
    if (rows[0].author_id !== userId && !roles.length) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('UPDATE threads SET is_deleted = TRUE WHERE public_id = ?', [publicId]);
    res.json({ message: 'Thread deleted' });
  } catch (err) {
    logger.error('deleteThread error:', err);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
};

// ─── Replies ──────────────────────────────────────────────────────────────────

export const getReplies = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { page = 1 } = req.query;
    const offset = (Number(page) - 1) * PAGE_SIZE;

    const [thread] = await db.query(
      'SELECT id, is_locked FROM threads WHERE public_id = ? AND is_deleted = FALSE',
      [publicId]
    );
    if (!thread.length) return res.status(404).json({ error: 'Thread not found' });

    const [replies] = await db.query(
      `SELECT r.id, r.public_id, r.author_id, r.body, r.is_deleted, r.parent_reply_id,
              r.created_at, r.updated_at,
              p.username AS author_username, p.display_name AS author_display_name,
              p.avatar_url AS author_avatar,
              (SELECT GROUP_CONCAT(role) FROM user_roles WHERE user_id = r.author_id) AS author_roles
       FROM thread_replies r
       JOIN profiles p ON r.author_id = p.id
       WHERE r.thread_id = ?
       ORDER BY r.created_at ASC
       LIMIT ? OFFSET ?`,
      [thread[0].id, PAGE_SIZE, offset]
    );

    const formatted = replies.map(r => ({
      ...r,
      body: r.is_deleted ? '[deleted]' : r.body,
      author_roles: r.author_roles ? r.author_roles.split(',') : [],
    }));

    // Attach reactions
    if (formatted.length) {
      const ids = formatted.map(r => r.id);
      const [reactions] = await db.query(
        `SELECT target_id, reaction, COUNT(*) AS count FROM thread_reactions
         WHERE target_type = 'reply' AND target_id IN (?)
         GROUP BY target_id, reaction`,
        [ids]
      );
      const reactionMap = {};
      reactions.forEach(r => {
        if (!reactionMap[r.target_id]) reactionMap[r.target_id] = [];
        reactionMap[r.target_id].push({ reaction: r.reaction, count: r.count });
      });
      formatted.forEach(r => { r.reactions = reactionMap[r.id] || []; });

      if (req.user) {
        const [myReactions] = await db.query(
          `SELECT target_id, reaction FROM thread_reactions
           WHERE user_id = ? AND target_type = 'reply' AND target_id IN (?)`,
          [req.user.id, ids]
        );
        const myMap = {};
        myReactions.forEach(r => { myMap[r.target_id] = r.reaction; });
        formatted.forEach(r => { r.my_reaction = myMap[r.id] || null; });
      }
    }

    const [total] = await db.query(
      'SELECT COUNT(*) AS count FROM thread_replies WHERE thread_id = ? AND is_deleted = FALSE',
      [thread[0].id]
    );

    res.json({ replies: formatted, total: total[0].count, page: Number(page), isLocked: thread[0].is_locked });
  } catch (err) {
    logger.error('getReplies error:', err);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
};

export const createReply = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { body, parent_reply_id } = req.body;
    const author_id = req.user.id;

    if (!body?.trim()) return res.status(400).json({ error: 'Reply body is required' });
    if (body.length > 10000) return res.status(400).json({ error: 'Reply too long (max 10000 chars)' });

    const [thread] = await db.query(
      'SELECT id, is_locked FROM threads WHERE public_id = ? AND is_deleted = FALSE',
      [publicId]
    );
    if (!thread.length) return res.status(404).json({ error: 'Thread not found' });
    if (thread[0].is_locked) return res.status(403).json({ error: 'Thread is locked' });

    // Validate parent reply belongs to this thread
    let parentId = null;
    if (parent_reply_id) {
      const [parent] = await db.query(
        'SELECT id FROM thread_replies WHERE id = ? AND thread_id = ? AND is_deleted = FALSE',
        [parent_reply_id, thread[0].id]
      );
      if (parent.length) parentId = parent_reply_id;
    }

    const public_id = uuidv4();
    const [result] = await db.query(
      'INSERT INTO thread_replies (public_id, thread_id, author_id, body, parent_reply_id) VALUES (?, ?, ?, ?, ?)',
      [public_id, thread[0].id, author_id, body.trim(), parentId]
    );

    // Update thread metadata
    await db.query(
      'UPDATE threads SET reply_count = reply_count + 1, last_reply_at = NOW(), last_reply_user_id = ? WHERE id = ?',
      [author_id, thread[0].id]
    );

    // Get the created reply with author info for immediate display
    const [created] = await db.query(
      `SELECT r.id, r.public_id, r.author_id, r.body, r.parent_reply_id, r.created_at,
              p.username AS author_username, p.display_name AS author_display_name,
              p.avatar_url AS author_avatar
       FROM thread_replies r
       JOIN profiles p ON r.author_id = p.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ ...created[0], message: 'Reply posted' });
  } catch (err) {
    logger.error('createReply error:', err);
    res.status(500).json({ error: 'Failed to post reply' });
  }
};

export const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;

    const [rows] = await db.query('SELECT author_id FROM thread_replies WHERE public_id = ?', [replyId]);
    if (!rows.length) return res.status(404).json({ error: 'Reply not found' });

    const [roles] = await db.query('SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"', [userId]);
    if (rows[0].author_id !== userId && !roles.length) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('UPDATE thread_replies SET is_deleted = TRUE WHERE public_id = ?', [replyId]);
    res.json({ message: 'Reply deleted' });
  } catch (err) {
    logger.error('deleteReply error:', err);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
};

// ─── Reactions ────────────────────────────────────────────────────────────────

export const toggleReaction = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { reaction = '👍' } = req.body;
    const userId = req.user.id;

    if (!['thread', 'reply'].includes(targetType)) {
      return res.status(400).json({ error: 'Invalid target type' });
    }

    const [existing] = await db.query(
      'SELECT id, reaction FROM thread_reactions WHERE user_id = ? AND target_type = ? AND target_id = ?',
      [userId, targetType, targetId]
    );

    if (existing.length > 0) {
      if (existing[0].reaction === reaction) {
        // Same reaction — remove it (toggle off)
        await db.query('DELETE FROM thread_reactions WHERE id = ?', [existing[0].id]);
        return res.json({ action: 'removed', reaction });
      } else {
        // Different reaction — update it
        await db.query('UPDATE thread_reactions SET reaction = ? WHERE id = ?', [reaction, existing[0].id]);
        return res.json({ action: 'updated', reaction });
      }
    }

    await db.query(
      'INSERT INTO thread_reactions (user_id, target_type, target_id, reaction) VALUES (?, ?, ?, ?)',
      [userId, targetType, targetId, reaction]
    );
    res.json({ action: 'added', reaction });
  } catch (err) {
    logger.error('toggleReaction error:', err);
    res.status(500).json({ error: 'Failed to toggle reaction' });
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const pinThread = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { is_pinned } = req.body;
    await db.query('UPDATE threads SET is_pinned = ? WHERE public_id = ?', [is_pinned, publicId]);
    res.json({ message: `Thread ${is_pinned ? 'pinned' : 'unpinned'}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update thread' });
  }
};

export const lockThread = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { is_locked } = req.body;
    await db.query('UPDATE threads SET is_locked = ? WHERE public_id = ?', [is_locked, publicId]);
    res.json({ message: `Thread ${is_locked ? 'locked' : 'unlocked'}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update thread' });
  }
};
