import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-10 md:flex md:justify-between md:space-x-8">
        {/* About Section */}
        <div className="mb-8 md:mb-0 md:w-1/3">
          <h2 className="text-xl font-semibold mb-4">Alif Mentorship Hub</h2>
          <p className="text-sm mb-4">
            Empowering Somali students to reach their full potential through
            mentorship, education, and career guidance.
          </p>
          {/* Social Media Icons */}
          <div className="flex space-x-4 mt-4">
            {/* Facebook */}
            <a
              href="#"
              className="p-2 rounded-full hover:bg-blue-600 transition"
              aria-label="Facebook"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M22 12c0-5.522-4.478-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H13v-2.89h-4.562V9.797c0-4.523 2.675-7.007 6.773-7.007 1.954 0 4.005.351 4.005.351v4.414h-2.257c-2.227 0-2.92 1.382-2.92 2.798v3.364H19v-4.34c0-4.478-2.582-6.927-6.256-6.927-1.709 0-3.473.292-3.473.292v4.062h1.963v2.89H9.827V21.878C14.543 21.128 18 16.991 18 12z" />
              </svg>
            </a>
            {/* Twitter */}
            <a
              href="#"
              className="p-2 rounded-full hover:bg-blue-600 transition"
              aria-label="Twitter"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M23 3a10.9 10.9 0 01-3.14.86 4.48 4.48 0 002-2.48 9.02 9.02 0 01-2.86 1.09 4.52 4.52 0 00-7.7 4.13A12.94 12.94 0 013 4.15a4.52 4.52 0 001.39 6.04A4.52 4.52 0 012 9.13v.05a4.52 4.52 0 003.63 4.43 4.52 4.52 0 01-2.05.08 4.52 4.52 0 004.2 3.13A9.04 9.04 0 012 19.54a12.91 12.91 0 006.99 2.05c8.39 0 12.97-6.94 12.97-12.94 0-.2-.01-.39-.02-.58A9.3 9.3 0 0023 3z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="#"
              className="p-2 rounded-full hover:bg-pink-600 transition"
              aria-label="Instagram"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.055 1.97.24 2.43.404a4.92 4.92 0 011.775 1.124 4.92 4.92 0 011.124 1.775c.164.46.349 1.26.404 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.055 1.17-.24 1.97-.404 2.43a4.92 4.92 0 01-1.124 1.775 4.92 4.92 0 01-1.775 1.124c-.46.164-1.26.349-2.43.404-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.055-1.97-.24-2.43-.404a4.92 4.92 0 01-1.775-1.124 4.92 4.92 0 01-1.124-1.775c-.164-.46-.349-1.26-.404-2.43-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.055-1.17.24-1.97.404-2.43a4.92 4.92 0 011.124-1.775 4.92 4.92 0 011.775-1.124c.46-.164 1.26-.349 2.43-.404 1.266-.058 1.646-.07 4.85-.07zm0-2.163C8.736 0 8.332.012 7.052.07 5.782.128 4.767.31 3.94.582a6.998 6.998 0 00-2.542 1.548A6.998 6.998 0 00.582 4.07c-.272.827-.454 1.842-.512 3.112C0 8.736 0 9.14 0 12s.012 3.264.07 4.944c.058 1.27.24 2.285.512 3.112a6.998 6.998 0 001.548 2.542 6.998 6.998 0 002.542 1.548c.827.272 1.842.454 3.112.512C8.736 24 9.14 24 12 24s3.264-.012 4.944-.07c1.27-.058 2.285-.24 3.112-.512a6.998 6.998 0 002.542-1.548 6.998 6.998 0 001.548-2.542c.272-.827.454-1.842.512-3.112.058-1.68.07-2.084.07-4.944s-.012-3.264-.07-4.944c-.058-1.27-.24-2.285-.512-3.112a6.998 6.998 0 00-1.548-2.542 6.998 6.998 0 00-2.542-1.548c-.827-.272-1.842-.454-3.112-.512C15.264.012 14.86 0 12 0z" />
                <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-7.998 3.999 3.999 0 010 7.998zM20.49 4.509a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
              </svg>
            </a>
            {/* TikTok */}
            <a
              href="#"
              className="p-2 rounded-full hover:bg-black transition"
              aria-label="TikTok"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2c-1.105 0-2 .895-2 2v4.91A4.09 4.09 0 008 12v4a4.09 4.09 0 004 4 4.09 4.09 0 004-4v-5a4.09 4.09 0 00-4-4V4c0-1.105-.895-2-2-2zm0 2c.552 0 1 .448 1 1v4c0 .552-.448 1-1 1s-1-.448-1-1V5c0-.552.448-1 1-1zm0 8c.552 0 1 .448 1 1v4c0 .552-.448 1-1 1s-1-.448-1-1v-4c0-.552.448-1 1-1z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8 md:mb-0 md:w-1/3">
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="/"
                className="hover:underline hover:text-white transition"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="/about"
                className="hover:underline hover:text-white transition"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="/programs"
                className="hover:underline hover:text-white transition"
              >
                Programs
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="hover:underline hover:text-white transition"
              >
                Contact
              </a>
            </li>
            <li>
              <a
                href="/privacy"
                className="hover:underline hover:text-white transition"
              >
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="md:w-1/3">
          <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
          <p className="text-sm mb-2">
            <strong>Address:</strong> 123 Somali Street, Mogadishu
          </p>
          <p className="text-sm mb-2">
            <strong>Phone:</strong> +252 61 234 5678
          </p>
          <p className="text-sm mb-2">
            <strong>Email:</strong> info@alifmentorship.org
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-gray-400 text-sm">
        © {currentYear} Alif Mentorship Hub. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
