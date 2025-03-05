import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#208706] text-white py-8 px-4 text-center">
      <div className="container mx-auto">
        {/* Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          {/* Footer Left */}
          <div className="flex-1 mb-6 md:mb-0">
            <h2 className="text-3xl font-bold mb-2">Ecorecycle</h2>
            <p className="text-[#8AA9B0] text-lg">
              Sustainability for a better tomorrow
            </p>
          </div>

          {/* Footer Right */}
          <div className="flex-1 md:text-right">
            <ul className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center md:justify-end">
              <li>
                <a
                  href="/home"
                  className="text-white hover:text-[#8AA9B0] transition-colors duration-300"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-white hover:text-[#8AA9B0] transition-colors duration-300"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/services"
                  className="text-white hover:text-[#8AA9B0] transition-colors duration-300"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-white hover:text-[#8AA9B0] transition-colors duration-300"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-6">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Ecorecycle. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
