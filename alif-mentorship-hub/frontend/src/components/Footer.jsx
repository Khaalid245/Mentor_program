const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white shadow-md border-t border-gray-200 mt-20">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center">
          <p className="text-gray-600 text-sm text-center">
            © {currentYear} Alif Mentorship Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;