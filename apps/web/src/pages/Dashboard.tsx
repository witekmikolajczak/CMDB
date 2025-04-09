import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUsersCount, 
  getUsersCountThisWeek,
  getDepartmentsCount,
  getAssetsCount,
  getAssetsCountThisMonth,
  getActiveAssignmentsCount,
  getAssignmentsCountThisWeek
} from '../api/apiClient';

// Import page components
import AssetsPage from './AssetsPage';
import UsersPage from './UsersPage';
import DepartmentsPage from './DepartmentsPage';
import AssignmentsPage from './AssignmentsPage';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';
import ProfilePage from './ProfilePage';

// Navigation items type
interface NavItem {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType;
  adminOnly?: boolean;
}

// Navigation configuration
const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Dashboard',
    icon: '📊',
    component: OverviewContent
  },
  {
    id: 'assets',
    label: 'Assets',
    icon: '💻',
    component: AssetsPage
  },
  {
    id: 'users',
    label: 'Users',
    icon: '👥',
    component: UsersPage
  },
  {
    id: 'departments',
    label: 'Departments',
    icon: '🏢',
    component: DepartmentsPage
  },
  {
    id: 'assignments',
    label: 'Assignments',
    icon: '📋',
    component: AssignmentsPage
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: '📝',
    component: ReportsPage
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    component: SettingsPage,
    adminOnly: true
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    component: ProfilePage
  }
];

// Overview Content Component
function OverviewContent() {
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [usersCountWeek, setUsersCountWeek] = useState<number | null>(null);
  const [departmentsCount, setDepartmentsCount] = useState<number | null>(null);
  const [assetsCount, setAssetsCount] = useState<number | null>(null);
  const [assetsCountMonth, setAssetsCountMonth] = useState<number | null>(null);
  const [assignmentsCount, setAssignmentsCount] = useState<number | null>(null);
  const [assignmentsCountWeek, setAssignmentsCountWeek] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          userCount, 
          weeklyUserCount,
          deptCount,
          assetCount,
          monthlyAssetCount,
          activeAssignCount,
          weeklyAssignCount
        ] = await Promise.all([
          getUsersCount(),
          getUsersCountThisWeek(),
          getDepartmentsCount(),
          getAssetsCount(),
          getAssetsCountThisMonth(),
          getActiveAssignmentsCount(),
          getAssignmentsCountThisWeek()
        ]);
        
        setUsersCount(userCount);
        setUsersCountWeek(weeklyUserCount);
        setDepartmentsCount(deptCount);
        setAssetsCount(assetCount);
        setAssetsCountMonth(monthlyAssetCount);
        setAssignmentsCount(activeAssignCount);
        setAssignmentsCountWeek(weeklyAssignCount);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="overview-content">
      <div className="dashboard-welcome">
        <h2>Welcome to InvenTrack CMDB</h2>
        <p>Your centralized asset management system</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Assets</h3>
          <p className="stat-value">{isLoading ? '...' : assetsCount}</p>
          <p className="stat-detail">{isLoading ? '...' : `+${assetsCountMonth} this month`}</p>
        </div>
        <div className="stat-card">
          <h3>Active Assignments</h3>
          <p className="stat-value">{isLoading ? '...' : assignmentsCount}</p>
          <p className="stat-detail">{isLoading ? '...' : `+${assignmentsCountWeek} this week`}</p>
        </div>
        <div className="stat-card">
          <h3>Departments</h3>
          <p className="stat-value">{isLoading ? '...' : departmentsCount}</p>
        </div>
        <div className="stat-card">
          <h3>Users</h3>
          <p className="stat-value">{isLoading ? '...' : usersCount}</p>
          <p className="stat-detail">{isLoading ? '...' : `+${usersCountWeek} this week`}</p>
        </div>
      </div>

      <div className="dashboard-quick-actions">
        <div className="quick-action-card">
          <h3>Recent Assignments</h3>
          <ul>
            <li>
              <span>MacBook Pro</span>
              <span>Assigned to John Doe</span>
              <span className="date">2 days ago</span>
            </li>
            <li>
              <span>Dell Monitor</span>
              <span>Assigned to Emily Chen</span>
              <span className="date">1 week ago</span>
            </li>
          </ul>
        </div>

        <div className="quick-action-card">
          <h3>Upcoming Returns</h3>
          <ul>
            <li>
              <span>Cisco Router</span>
              <span>Due in 5 days</span>
              <span className="status overdue">Overdue</span>
            </li>
            <li>
              <span>iPhone 14 Pro</span>
              <span>Due in 15 days</span>
              <span className="status active">Active</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="dashboard-insights">
        <div className="insight-card">
          <h3>Asset Types Distribution</h3>
          <div className="asset-distribution">
            <div className="distribution-item">
              <span>Laptops</span>
              <div className="distribution-bar">
                <div 
                  className="bar-fill" 
                  style={{width: '45%', backgroundColor: '#8A4FFF'}}
                ></div>
              </div>
              <span>45%</span>
            </div>
            <div className="distribution-item">
              <span>Monitors</span>
              <div className="distribution-bar">
                <div 
                  className="bar-fill" 
                  style={{width: '25%', backgroundColor: '#4ECDC4'}}
                ></div>
              </div>
              <span>25%</span>
            </div>
            <div className="distribution-item">
              <span>Mobile Devices</span>
              <div className="distribution-bar">
                <div 
                  className="bar-fill" 
                  style={{width: '20%', backgroundColor: '#FFD166'}}
                ></div>
              </div>
              <span>20%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Dashboard: React.FC = () => {
  const { user, logout, getProfilePictureUrl } = useAuth();
  const [activeNavItem, setActiveNavItem] = useState('overview');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Filter navigation items based on user role
  const filteredNavItems = NAV_ITEMS.filter(
    item => !item.adminOnly || user?.role === 'admin'
  );

  // Get the active component
  const ActiveComponent = NAV_ITEMS.find(
    item => item.id === activeNavItem
  )?.component || OverviewContent;

  // Fetch profile image
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const pictureUrl = getProfilePictureUrl();
        if (!pictureUrl) return;
        
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        const response = await fetch(pictureUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setProfileImageUrl(imageUrl);
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      }
    };

    if (user) {
      fetchProfileImage();
    }
  }, [user, getProfilePictureUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo-container">
          <img src="./logo-small.svg" alt="logo" width="60px" />
          <h1 className="app-title">InvenTrack</h1>
        </div>
        <div className="user-menu">
          <div 
            className="user-info-container" 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt="Profile" 
                  className="user-profile-image" 
                />
              ) : (
                <div className="user-profile-placeholder">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` 
                    : 'U'}
                </div>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <span className="dropdown-arrow">▼</span>
          </div>
          {showUserMenu && (
            <div className="user-dropdown">
              <div 
                className="dropdown-item"
                onClick={() => {
                  setActiveNavItem('profile');
                  setShowUserMenu(false);
                }}
              >
                <span className="dropdown-icon">👤</span>
                <span>Profile</span>
              </div>
              <div className="dropdown-divider"></div>
              <div 
                className="dropdown-item logout-item"
                onClick={logout}
              >
                <span className="dropdown-icon">🚪</span>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-sidebar">
          <nav className="dashboard-nav">
            <ul>
              {filteredNavItems.map(item => (
                <li 
                  key={item.id}
                  className={`nav-item ${activeNavItem === item.id ? 'active' : ''}`}
                  onClick={() => setActiveNavItem(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="dashboard-main">
          {activeNavItem === 'profile' ? <ProfilePage /> : <ActiveComponent />}
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>&copy; {new Date().getFullYear()} InvenTrack CMDB. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;