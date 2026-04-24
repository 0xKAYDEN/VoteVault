import db from '../db.js';
import { invalidateCache } from '../middleware/cache.js';

// Get all active categories
export const getAllCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY display_order ASC, name ASC'
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get category by slug with server count
export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const [categories] = await db.query(
      'SELECT * FROM categories WHERE slug = ? AND is_active = true',
      [slug]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = categories[0];

    // Get server count for this category
    const [countResult] = await db.query(
      'SELECT COUNT(*) as count FROM server_categories WHERE category_id = ?',
      [category.id]
    );

    category.server_count = countResult[0].count;

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

// Get servers by category
export const getServersByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    // First get the category
    const [categories] = await db.query(
      'SELECT id FROM categories WHERE slug = ? AND is_active = true',
      [slug]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const categoryId = categories[0].id;

    // Get servers in this category
    const [servers] = await db.query(`
      SELECT s.*
      FROM servers s
      INNER JOIN server_categories sc ON s.id = sc.server_id
      WHERE sc.category_id = ? AND s.status = 'approved'
      ORDER BY s.vote_count DESC
    `, [categoryId]);

    res.json(servers);
  } catch (error) {
    console.error('Error fetching servers by category:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
};

// Get categories for a specific server
export const getServerCategories = async (req, res) => {
  try {
    const { serverId } = req.params;

    const [categories] = await db.query(`
      SELECT c.*
      FROM categories c
      INNER JOIN server_categories sc ON c.id = sc.category_id
      WHERE sc.server_id = ? AND c.is_active = true
      ORDER BY c.display_order ASC
    `, [serverId]);

    res.json(categories);
  } catch (error) {
    console.error('Error fetching server categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Add category to server (owner only)
export const addCategoryToServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { categoryId } = req.body;
    const userId = req.user.id;

    // Check if user owns the server
    const [servers] = await db.query(
      'SELECT id FROM servers WHERE id = ? AND owner_id = ?',
      [serverId, userId]
    );

    if (servers.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if category exists
    const [categories] = await db.query(
      'SELECT id FROM categories WHERE id = ? AND is_active = true',
      [categoryId]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Add the category (ignore if already exists)
    await db.query(
      'INSERT IGNORE INTO server_categories (server_id, category_id) VALUES (?, ?)',
      [serverId, categoryId]
    );

    // Invalidate related caches
    await invalidateCache('cache:/api/categories/*');
    await invalidateCache(`cache:/api/servers*`);

    res.json({ message: 'Category added successfully' });
  } catch (error) {
    console.error('Error adding category to server:', error);
    res.status(500).json({ error: 'Failed to add category' });
  }
};

// Remove category from server (owner only)
export const removeCategoryFromServer = async (req, res) => {
  try {
    const { serverId, categoryId } = req.params;
    const userId = req.user.id;

    // Check if user owns the server
    const [servers] = await db.query(
      'SELECT id FROM servers WHERE id = ? AND owner_id = ?',
      [serverId, userId]
    );

    if (servers.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query(
      'DELETE FROM server_categories WHERE server_id = ? AND category_id = ?',
      [serverId, categoryId]
    );

    // Invalidate related caches
    await invalidateCache('cache:/api/categories/*');
    await invalidateCache(`cache:/api/servers*`);

    res.json({ message: 'Category removed successfully' });
  } catch (error) {
    console.error('Error removing category from server:', error);
    res.status(500).json({ error: 'Failed to remove category' });
  }
};
