import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { ImCross } from "react-icons/im";
import toast from "react-hot-toast";
import logo from "../assets/EcoLogo.png";
import { useAuth } from "../Context/authContext";

// One source of truth instead of two hand-maintained copies of the same links.
const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/contact", label: "Contact" },
];

const linkClass = ({ isActive }) =>
  [
    "text-lg transition-colors duration-300",
    isActive
      ? "text-[#1D916E] font-semibold underline underline-offset-4"
      : "text-[#1D4C6C] hover:text-[#1D916E]",
  ].join(" ");

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    toast.success("Signed out successfully");
  };

  return (
    <header className="bg-[#f0f8ff] py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" onClick={closeMenu} aria-label="EcoRecycle home">
          <img src={logo} alt="EcoRecycle" className="w-20" />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={closeMenu}>
              {label}
            </NavLink>
          ))}

          {isAuthenticated ? (
            <>
              <span className="text-[#1D4C6C] text-sm max-w-32 truncate">
                Hi, {user?.name?.split(" ")[0] || "there"}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="w-20 rounded bg-red-500 py-1 text-lg text-white transition-colors duration-300 hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={closeMenu}>
                Login
              </NavLink>
              <Link
                to="/signup"
                onClick={closeMenu}
                className="w-20 rounded bg-[#1D916E] py-1 text-center text-lg text-white transition-colors duration-300 hover:bg-[#177a5c]"
              >
                Signup
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden text-[#1D4C6C] text-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D916E]"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
        >
          {isMenuOpen ? <ImCross /> : <GiHamburgerMenu />}
        </button>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <nav
            id="mobile-nav"
            className="md:hidden absolute top-16 right-0 w-full bg-[#f0f0f0] flex flex-col gap-4 p-4"
          >
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={(state) => `${linkClass(state)} text-center`}
                onClick={closeMenu}
              >
                {label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mx-auto w-24 rounded bg-red-500 py-1 text-lg text-white transition-colors duration-300 hover:bg-red-600"
              >
                Logout
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={(state) => `${linkClass(state)} text-center`}
                  onClick={closeMenu}
                >
                  Login
                </NavLink>
                <Link
                  to="/signup"
                  onClick={closeMenu}
                  className="mx-auto w-24 rounded bg-[#1D916E] py-1 text-center text-lg text-white transition-colors duration-300 hover:bg-[#177a5c]"
                >
                  Signup
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
