# Admin Role Management Feature

## Overview
Admins can now manage all user roles through an enhanced interface in the Admin Users page.

## Available Roles

The system supports 5 roles with distinct colors and icons:

1. **Player** (Default)
   - Icon: User
   - Color: Gray
   - Basic user role

2. **Server Owner**
   - Icon: Crown
   - Color: Primary/Crimson
   - Can create and manage servers

3. **Moderator (Mod)**
   - Icon: Shield
   - Color: Blue
   - Moderation privileges

4. **VIP**
   - Icon: Star
   - Color: Yellow
   - Premium user status

5. **Admin**
   - Icon: ShieldAlert
   - Color: Rose/Red
   - Full system access

## Features

### 1. **Role Management Dialog**
- Click "Manage Roles" button for any user
- Opens a dialog with checkboxes for all available roles
- Select/deselect multiple roles at once
- Visual icons and colors for each role
- Save or cancel changes

### 2. **Visual Role Display**
- Roles displayed as colored badges
- Each role has a unique color scheme
- Easy to identify user permissions at a glance
- Shows "No roles" if user has no assigned roles

### 3. **Multi-Role Support**
- Users can have multiple roles simultaneously
- Example: A user can be both VIP and Server Owner
- Flexible permission system

### 4. **Search Functionality**
- Search users by email, username, or display name
- Filter results in real-time
- Works with role management

## UI Components

### Role Badge Colors:
- **Player**: Gray border, muted text
- **Server Owner**: Primary glow, crimson gradient background
- **Moderator**: Blue border, blue text, blue background
- **VIP**: Yellow border, yellow text, yellow background
- **Admin**: Rose border, rose text, rose background

### Dialog Layout:
- Clean modal interface
- Checkbox list with icons
- User identification in header
- Save/Cancel buttons at bottom

## Backend Integration

Uses existing API endpoint:
```
PUT /api/admin/users/:userId/roles
Body: { roles: ["role1", "role2", ...] }
```

The backend already supports multiple roles through the `user_roles` table.

## How to Use

### For Admins:

1. **Navigate to Admin Panel**
   - Go to `/admin/users`

2. **Find User**
   - Use search bar to find specific user
   - Or scroll through user list

3. **Manage Roles**
   - Click "Manage Roles" button for the user
   - Check/uncheck desired roles
   - Click "Save Changes"

4. **Verify Changes**
   - Role badges update immediately
   - User permissions take effect instantly

### Role Assignment Examples:

**New Server Owner:**
- Check: Server Owner
- Result: User can create servers

**Community Moderator:**
- Check: Moderator
- Result: User gets moderation privileges

**Premium VIP User:**
- Check: VIP, Server Owner
- Result: User gets VIP status + can create servers

**Full Admin:**
- Check: Admin
- Result: User gets full system access

## Database Schema

Roles are stored in the `user_roles` table:
```sql
CREATE TABLE user_roles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  role ENUM('player', 'server_owner', 'admin', 'vip', 'mod') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, role)
);
```

Each role is a separate row, allowing multiple roles per user.

## Security

- Only admins can access the role management interface
- Role changes are logged
- API endpoint requires admin authentication
- Cannot remove your own admin role (prevents lockout)

## Benefits

1. **Flexible Permissions**: Assign multiple roles to users
2. **Visual Clarity**: Color-coded badges for easy identification
3. **Easy Management**: Simple checkbox interface
4. **Scalable**: Easy to add new roles in the future
5. **Audit Trail**: All role changes are tracked

## Future Enhancements

Potential additions:
- Role change history/audit log
- Bulk role assignment
- Role templates
- Custom role creation
- Role-based permissions matrix
- Email notifications on role changes

## Testing

Test the feature:
1. Login as admin
2. Go to `/admin/users`
3. Click "Manage Roles" on any user
4. Toggle different roles
5. Save and verify badges update
6. Test with multiple roles
7. Verify permissions work correctly

## Notes

- Users always need at least one role (typically 'player')
- Removing all roles may cause issues - keep at least 'player'
- Admin role gives full access to all features
- Server Owner role is auto-assigned when creating first server
- VIP and Mod roles are manually assigned by admins
