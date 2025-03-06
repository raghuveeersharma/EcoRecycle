import { useContext, useState } from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import { GiHamburgerMenu } from "react-icons/gi";
import { ImCross } from "react-icons/im";
import logo from ".././assets/EcoLogo.png";
import { LoginStatee } from "../Context/LoginState";
import toast, { Toaster } from "react-hot-toast";

const Navbar = () => {
  const { LoginState, setLoginState } = useContext(LoginStatee);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    setLoginState(false);
    setIsMenuOpen(false);
    toast.success("User logged out successfully!");
  };

  return (
    <header className="bg-[#f0f8ff] py-4 sticky top-0 z-50">
      <Toaster />
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <div className="logo">
          <img src={logo} alt="EcoLogo" className="w-20" />
        </div>

        {/* Desktop Navigation */}
        <nav
          className={`hidden md:flex gap-6 items-center ${
            isMenuOpen ? "flex" : "hidden"
          }`}
        >
          <Link
            to="/"
            className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link
            to="/services"
            className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            Services
          </Link>
          <Link
            to="/contact"
            className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            Contact
          </Link>
          <Link
            to="/Signup"
            className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            Signup
          </Link>
          {/* <Link
            to="/login"
            className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            Login
          </Link> */}
          <button
            disabled={!LoginState}
            className={`text-[#1D4C6C] w-20 rounded text-lg ${
              LoginState
                ? `bg-red-500 text-white`
                : `bg-gray-300 text-black cursor-not-allowed`
            } transition-colors duration-300 text-center `}
            onClick={() => {
              handleLogout();
            }}
          >
            Logout
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[#1D4C6C] text-2xl focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {!isMenuOpen ? <GiHamburgerMenu /> : <ImCross />}
        </button>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden absolute top-16 right-0 w-full bg-[#f0f0f0] flex flex-col gap-4 p-4">
            <Link
              to="/"
              className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300 text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300 text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/services"
              className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300 text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              to="/contact"
              className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300 text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            {/* <Link
              to="/login"
              className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300 text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link> */}
            <Link
              to="/Signup"
              className="text-[#1D4C6C] text-lg hover:text-[#1D916E] transition-colors duration-300 text-center"
              onClick={() => setLoginState(false)}
            >
              Signup
            </Link>
            <button
              className={`text-[#1D4C6C] w-20 mx-auto rounded text-lg ${
                LoginState ? `bg-red-500 text-white` : `bg-gray-300 text-black`
              } transition-colors duration-300 text-center `}
              onClick={() => {
                handleLogout();
              }}
            >
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
