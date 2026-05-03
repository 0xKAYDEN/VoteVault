import pool from '../db.js';
import logger from '../utils/logger.js';

// Create a group chat
export const createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, memberIds = [] } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Group name is required' });
    if (name.length > 100) return res.status(400).json({ error: 'Name too long (max 100 chars)' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        'INSERT INTO group_chats (name, created_by) VALUES (?, ?)',
        [name.trim(), userId]
      );
      const groupId = result.insertId;

      // Add creator as admin
      await conn.query(
        'INSERT INTO group_chat_members (group_id, user_id, role) VALUES (?, ?, "admin")',
        [groupId, userId]
      );

      // Add other members (must be friends)
      const uniqueMembers = [...new Set(memberIds)].filter(id => id !== userId);
      for (const memberId of uniqueMembers.slice(0, 49)) { // max 50 members
        const [friendship] = await conn.query(
          `SELECT id FROM friendships WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)`,
          [userId, memberId, memberId, userId]
        );
        if (friendship.length > 0) {
          await conn.query(
            'INSERT IGNORE INTO group_chat_members (group_id, user_id) VALUES (?, ?)',
            [groupId, memberId]
          );
        }
      }

      await conn.commit();
      logger.info(`Group chat "${name}" created by ${userId} (id: ${groupId})`);
      res.status(201).json({ id: groupId, name: name.trim(), message: 'Group created' });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error) {
    logger.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

// Get all groups the user is in
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const [groups] = await pool.query(
      `SELECT gc.id, gc.name, gc.avatar_url, gc.created_at,
              gcm.role,
              (SELECT COUNT(*) FROM group_chat_members WHERE group_id = gc.id) AS member_count,
              (SELECT message FROM group_messages WHERE group_id = gc.id ORDER BY created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM group_messages WHERE group_id = gc.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
       FROM group_chats gc
       JOIN group_chat_members gcm ON gc.id = gcm.group_id AND gcm.user_id = ?
       ORDER BY last_message_at DESC, gc.created_at DESC`,
      [userId]
    );

    res.json(groups);
  } catch (error) {
    logger.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify membership
    const [member] = await pool.query(
      'SELECT id FROM group_chat_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    if (!member.length) return res.status(403).json({ error: 'Not a member of this group' });

    const [messages] = await pool.query(
      `SELECT gm.*, p.username, p.display_name, p.avatar_url
       FROM group_messages gm
       JOIN profiles p ON gm.sender_id = p.id
       WHERE gm.group_id = ?
       ORDER BY gm.created_at DESC
       LIMIT ? OFFSET ?`,
      [groupId, Number(limit), Number(offset)]
    );

    res.json(messages.reverse());
  } catch (error) {
    logger.error('Error fetching group messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send a message to a group
export const sendGroupMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const { message } = req.body;

    if (!message?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
    if (message.length > 2000) return res.status(400).json({ error: 'Message too long' });

    // Verify membership
    const [member] = await pool.query(
      'SELECT id FROM group_chat_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    if (!member.length) return res.status(403).json({ error: 'Not a member of this group' });

    const [result] = await pool.query(
      'INSERT INTO group_messages (group_id, sender_id, message) VALUES (?, ?, ?)',
      [groupId, userId, message.trim()]
    );

    const [msg] = await pool.query(
      `SELECT gm.*, p.username, p.display_name, p.avatar_url
       FROM group_messages gm JOIN profiles p ON gm.sender_id = p.id
       WHERE gm.id = ?`,
      [result.insertId]
    );

    res.json(msg[0]);
  } catch (error) {
    logger.error('Error sending group message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get group members
export const getGroupMembers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const [member] = await pool.query(
      'SELECT id FROM group_chat_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    if (!member.length) return res.status(403).json({ error: 'Not a member' });

    const [members] = await pool.query(
      `SELECT gcm.user_id, gcm.role, gcm.joined_at,
              p.username, p.display_name, p.avatar_url,
              uos.is_online
       FROM group_chat_members gcm
       JOIN profiles p ON gcm.user_id = p.id
       LEFT JOIN user_online_status uos ON gcm.user_id = uos.user_id
       WHERE gcm.group_id = ?
       ORDER BY gcm.role DESC, p.display_name ASC`,
      [groupId]
    );

    res.json(members);
  } catch (error) {
    logger.error('Error fetching group members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

// Add member to group (admin only)
export const addGroupMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const { memberId } = req.body;

    const [admin] = await pool.query(
      'SELECT role FROM group_chat_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    if (!admin.length || admin[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    await pool.query(
      'INSERT IGNORE INTO group_chat_members (group_id, user_id) VALUES (?, ?)',
      [groupId, memberId]
    );

    res.json({ message: 'Member added' });
  } catch (error) {
    logger.error('Error adding group member:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    await pool.query(
      'DELETE FROM group_chat_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    // If no members left, delete the group
    const [remaining] = await pool.query(
      'SELECT COUNT(*) AS count FROM group_chat_members WHERE group_id = ?',
      [groupId]
    );
    if (remaining[0].count === 0) {
      await pool.query('DELETE FROM group_chats WHERE id = ?', [groupId]);
    }

    res.json({ message: 'Left group' });
  } catch (error) {
    logger.error('Error leaving group:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
};
