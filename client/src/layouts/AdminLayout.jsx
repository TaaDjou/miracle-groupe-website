import { Outlet } from 'react-router-dom';

// Gives the admin section its own "back office" visual identity (see .admin-theme in
// App.css) without affecting the rest of the site or the persistent sidebar.
function AdminLayout() {
  return (
    <div className="admin-theme">
      <Outlet />
    </div>
  );
}

export default AdminLayout;
