# ChemStock - Role-Based Access Control Guide

## 🎭 User Roles Overview

ChemStock has two distinct user roles with different permission levels:

1. **Admin** - Full control over inventory management and system configuration
2. **Regular User (Student/Lab Member)** - View and use inventory with restricted editing

---

## 👤 Regular User Permissions

Regular users can **view and use** the inventory but **cannot edit** quantities or manage data.

### ✅ What Regular Users Can Do:

#### **Dashboard**
- ✅ View inventory statistics
- ✅ See low stock and out-of-stock alerts
- ✅ View priority chemicals list

#### **Chemicals Page**
- ✅ Search and browse all chemicals
- ✅ Filter by stock status (all, low, out of stock, available)
- ✅ Sort chemicals by name, quantity, last updated
- ✅ **Use chemicals** - Deduct quantities when using chemicals
- ✅ View chemical details (name, formula, CAS number, quantity)
- ❌ **Cannot edit** chemical quantities without edit mode
- ❌ Cannot enable edit mode (admin only)

#### **Equipment Page**
- ✅ Search and browse all equipment
- ✅ Filter by category and availability status
- ✅ Sort equipment by name, last used
- ✅ **Check out equipment** - Borrow equipment items
- ✅ **Return equipment** - Return borrowed items
- ✅ **Report damaged equipment**
- ✅ View equipment borrowed by them
- ❌ Cannot enable edit mode (admin only)

#### **Chemical Viewer**
- ✅ Search PubChem database for chemical information
- ✅ View chemical structures, properties, and safety data
- ✅ Browse chemical details

#### **Activity Logs**
- ✅ View all inventory activity logs
- ✅ Filter logs by action type, date, user
- ✅ Search logs by chemical/equipment name

#### **Cart/Reorder Page**
- ✅ View low-stock and out-of-stock chemicals
- ✅ See reorder suggestions
- ❌ Cannot add chemicals manually (admin only)
- ❌ Cannot place orders (admin only)
- ❌ Cannot download order lists (admin only)

#### **Settings**
- ✅ View account information
- ✅ Change theme (light/dark mode)
- ❌ Cannot access Firebase settings (admin only)

#### **Support**
- ✅ Access help documentation
- ✅ View contact information

### ❌ What Regular Users Cannot Do:
- ❌ Edit chemical or equipment quantities (without admin's edit mode enabled)
- ❌ Delete chemicals or equipment
- ❌ Add new chemicals or equipment to inventory
- ❌ Access admin panel
- ❌ Generate reports
- ❌ Backup or restore database
- ❌ Manage user permissions
- ❌ Place orders with suppliers
- ❌ Initialize or reset database

---

## 👨‍💼 Admin Permissions

Admins have **full control** over the entire system with all regular user permissions plus:

### ✅ What Admins Can Do (In Addition to Regular User):

#### **Dashboard**
- ✅ Everything regular users can do
- ✅ Access to admin panel link

#### **Chemicals Page**
- ✅ Everything regular users can do
- ✅ **Enable/Disable Edit Mode** - Toggle edit mode with Lock/Unlock switch
- ✅ **Edit chemical quantities** - Modify stock levels when edit mode is on
- ✅ **Export chemicals** - Download filtered chemical list as CSV
- ✅ Add new chemicals (via database)
- ✅ Delete chemicals (via database)

#### **Equipment Page**
- ✅ Everything regular users can do
- ✅ **Enable/Disable Edit Mode** - Toggle edit mode with Lock/Unlock switch
- ✅ **Export equipment** - Download filtered equipment list as CSV
- ✅ Add new equipment (via database)
- ✅ Delete equipment (via database)

#### **Cart/Reorder Page**
- ✅ Everything regular users can do
- ✅ **Add chemicals manually** - Add any chemical to reorder cart
- ✅ **Auto-fill suggested quantities** - Bulk set reorder amounts
- ✅ **Clear selection** - Bulk deselect all items
- ✅ **Download order list** - Export selected chemicals as CSV
- ✅ **Place orders** - Submit orders to suppliers
- ✅ **Select sellers** - Choose supplier for orders
- ✅ **Remove manually added items** - Delete items from cart

#### **Admin Panel** ⭐ (Admin Exclusive)
- ✅ **Reports Tab**:
  - Generate monthly usage reports
  - Generate yearly usage reports
  - Generate inventory reports
  - Generate audit logs
  - Export reports as CSV
  - View detailed statistics

- ✅ **Backup Tab**:
  - Export full database backup (JSON)
  - Restore database from backup file
  - Validate backup files
  - View backup metadata (timestamp, exported by, counts)

- ✅ **Database Management**:
  - Initialize database with sample data
  - View system health status
  - Monitor database statistics

#### **Reports Page**
- ✅ Access comprehensive reporting dashboard
- ✅ Generate custom date range reports
- ✅ View usage trends and analytics
- ✅ Export detailed reports

#### **Settings**
- ✅ Everything regular users can do
- ✅ **Firebase Settings** - Configure database connection
- ✅ Manage system preferences
- ✅ View admin-specific settings

#### **Database Initialization** (Admin Exclusive)
- ✅ Access `/init-db` page
- ✅ Populate database with sample chemicals
- ✅ Populate database with sample equipment
- ✅ Reset database (with confirmation)

---

## 🔐 Security & Access Control

### How Role Assignment Works:

1. **Admin Role Assignment**:
   - Configured via environment variable: `NEXT_PUBLIC_ADMIN_EMAILS`
   - Comma-separated list of admin email addresses
   - Example: `admin@example.com,lab.manager@university.edu`

2. **User Role Assignment**:
   - All users in `NEXT_PUBLIC_ALLOWED_EMAILS` who are NOT in admin list
   - Can access the application but with restricted permissions

3. **Authentication**:
   - All users must be listed in `NEXT_PUBLIC_ALLOWED_EMAILS` to login
   - Unauthorized email addresses are automatically logged out
   - Both Email/Password and Google Sign-in supported

### Environment Variable Configuration:

```env
# Admin users (full permissions)
NEXT_PUBLIC_ADMIN_EMAILS=admin@lab.edu,manager@lab.edu

# All allowed users (admins + regular users)
NEXT_PUBLIC_ALLOWED_EMAILS=admin@lab.edu,manager@lab.edu,student1@lab.edu,student2@lab.edu,researcher@lab.edu
```

---

## 🎯 Feature Matrix

| Feature | Regular User | Admin |
|---------|--------------|-------|
| View Dashboard | ✅ | ✅ |
| View Chemicals | ✅ | ✅ |
| Use Chemicals | ✅ | ✅ |
| Edit Chemical Quantities | ❌ | ✅ (with edit mode) |
| View Equipment | ✅ | ✅ |
| Check Out Equipment | ✅ | ✅ |
| Return Equipment | ✅ | ✅ |
| View Activity Logs | ✅ | ✅ |
| Search PubChem | ✅ | ✅ |
| View Cart/Reorder Page | ✅ | ✅ |
| Add Items to Cart Manually | ❌ | ✅ |
| Download Order Lists | ❌ | ✅ |
| Place Orders | ❌ | ✅ |
| Export to CSV | ❌ | ✅ |
| Access Admin Panel | ❌ | ✅ |
| Generate Reports | ❌ | ✅ |
| Backup Database | ❌ | ✅ |
| Restore Database | ❌ | ✅ |
| Initialize Database | ❌ | ✅ |
| Configure Firebase Settings | ❌ | ✅ |
| Enable/Disable Edit Mode | ❌ | ✅ |

---

## 🛡️ Best Practices for Lab Administrators

### For Admin Users:
1. **Keep Edit Mode Off** when not actively editing to prevent accidental changes
2. **Regular Backups** - Export database backups weekly
3. **Monitor Activity Logs** - Review user actions regularly
4. **Generate Reports** - Monthly usage reports for lab management
5. **Verify Orders** - Review cart items before placing orders with suppliers

### For Regular Users:
1. **Report Issues** - Contact admin if you notice incorrect quantities
2. **Use Activity Logs** - Check your own usage history
3. **Return Equipment** - Always log equipment returns properly
4. **Request Edits** - Ask admin to enable edit mode if corrections are needed

### For System Setup:
1. **Limit Admin Accounts** - Only assign admin role to lab managers/supervisors
2. **Document Admin Emails** - Keep record of who has admin access
3. **Regular Updates** - Keep dependencies and security patches up to date
4. **Test Backups** - Verify backup/restore functionality periodically

---

## 📞 Support

For questions about user roles or permissions:
- Contact your lab administrator
- Check the [README.md](../README.md) for setup instructions
- Review [FIREBASE_SETUP.md](../FIREBASE_SETUP.md) for authentication configuration

---

**Last Updated**: December 2025  
**ChemStock Version**: 1.0.0
