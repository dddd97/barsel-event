import { useState, useEffect, Fragment } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isRedirecting, logout } = useAuth();
  const location = useLocation();


  const adminMenuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Event', path: '/admin/events', icon: '📅' },
    { name: 'Peserta', path: '/admin/participants', icon: '👥' },
    { name: 'Hadiah', path: '/admin/prizes', icon: '🎁' },
  ];

  // Helper function to check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'moderator';
  };

  const handleScroll = () => {
    setIsScrolled(window.scrollY > 0);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when authentication state changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [isAuthenticated]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      setMobileMenuOpen(false); // Close mobile menu before logout
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200/50' : 'bg-transparent backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                className="h-8 sm:h-10 w-auto"
                src="/images/barsel-event.png"
                alt="Barsel Event Logo"
              />
              <span className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
                Barsel Event
              </span>
            </Link>
            
            {/* Desktop Events link */}
            <div className="hidden md:block">
              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `relative text-sm font-medium transition-colors hover:text-primary-600 ${
                    isActive 
                      ? 'text-primary-600 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-primary-600 after:content-[""]' 
                      : 'text-slate-600'
                  }`
                }
              >
                Events
              </NavLink>
            </div>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden items-center gap-4 md:flex">
            {/* User Menu */}
            {isAuthenticated && location.pathname !== '/login' && !isRedirecting ? (
              <Menu as="div" className="relative">
                <div>
                  <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    <span className="sr-only">Open user menu</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 ring-2 ring-white transition-all hover:bg-primary-200 overflow-hidden">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-5 w-5" />
                      )}
                    </div>
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                            {user?.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-7 w-7 text-primary-700" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                          <p className="truncate text-xs text-gray-500">{user?.email}</p>
                          {isAdmin() && (
                            <p className="text-xs text-primary-600 font-medium mt-1">Administrator</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin() && (
                      <>
                        <div className="px-3 py-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin Panel</p>
                        </div>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/admin/dashboard"
                              className={`${
                                active ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                              } block px-4 py-3 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center space-x-3`}
                            >
                              <span className="text-lg">🏠</span>
                              <span className="font-medium">Kembali ke Dashboard</span>
                            </Link>
                          )}
                        </Menu.Item>
                        {adminMenuItems.map((item) => (
                          <Menu.Item key={item.path}>
                            {({ active }) => (
                              <Link
                                to={item.path}
                                className={`${
                                  active ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                                } block px-4 py-3 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center space-x-3`}
                              >
                                <span className="text-lg">{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                              </Link>
                            )}
                          </Menu.Item>
                        ))}
                        <div className="border-t border-gray-100 my-2" />
                      </>
                    )}
                    
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } block w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3`}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          <span className="font-medium">Logout</span>
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : location.pathname !== '/login' && !isRedirecting ? (
              <NavLink
                to="/login"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-gray-100"
                aria-label="Login"
                title="Login"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-primary-600 hover:text-primary-700" />
              </NavLink>
            ) : null}
          </nav>
          
          {/* Mobile menu button - only show if authenticated or login button in mobile */}
          <div className="flex md:hidden">
            {isAuthenticated && !isRedirecting ? (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            ) : location.pathname !== '/login' && !isRedirecting ? (
              <NavLink
                to="/login"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-gray-100"
                aria-label="Login"
                title="Login"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-primary-600 hover:text-primary-700" />
              </NavLink>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile menu - only show if authenticated */}
      {isAuthenticated && !isRedirecting && (
        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
          show={mobileMenuOpen}
        >
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-white shadow-xl">
            <div className="flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mt-6 px-4 space-y-2">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </NavLink>
                
                <NavLink
                  to="/events"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Events
                </NavLink>
                
                
                {isAuthenticated && location.pathname !== '/login' && !isRedirecting && (
                  <>
                    <div className="border-t border-gray-100 my-4" />
                    <div className="px-3 py-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                            {user?.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-6 w-6 text-primary-700" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                          {isAdmin() && (
                            <p className="text-xs text-primary-600 font-medium">Administrator</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin() && (
                      <>
                        <div className="px-3 py-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin Panel</p>
                        </div>
                        <NavLink
                          to="/admin/dashboard"
                          className={({ isActive }) =>
                            `block rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                              isActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="flex items-center space-x-3">
                            <span className="text-lg">🏠</span>
                            <span>Kembali ke Dashboard</span>
                          </span>
                        </NavLink>
                        {adminMenuItems.map((item) => (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                              `block rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                                isActive
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                              }`
                            }
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="flex items-center space-x-3">
                              <span className="text-lg">{item.icon}</span>
                              <span>{item.name}</span>
                            </span>
                          </NavLink>
                        ))}
                      </>
                    )}
                    
                    <div className="border-t border-gray-100 my-2" />
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-lg px-3 py-2 text-left text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center space-x-3"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        </Transition>
      )}
    </header>
  );
}; 