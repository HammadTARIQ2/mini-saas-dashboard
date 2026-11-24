import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDown, LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/features/auth/auth-context';
import { Logo } from './Logo';

/** Shell for authenticated pages: top bar with branding and the user menu. */
export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Go to dashboard">
            <Logo />
          </Link>

          {user && (
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-slate-100">
                <Avatar name={user.name} />
                <span className="hidden font-medium text-slate-700 sm:block">{user.name}</span>
                <ChevronDown className="size-4 text-slate-400" aria-hidden="true" />
              </MenuButton>
              <MenuItems
                anchor="bottom end"
                transition
                className="z-40 mt-2 w-56 rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200 transition duration-100 ease-out focus:outline-none data-closed:scale-95 data-closed:opacity-0"
              >
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <MenuItem>
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 data-focus:bg-slate-100"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Sign out
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
