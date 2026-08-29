import { Link } from "react-router-dom"
import logo from "../assets/logo.png"

const Navbar = ({ isLanding }) => {
  const scrollToSection = (id) => {
    const section = document.querySelector(id)
    if (section) {
      section.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav className="fixed top-0 w-full bg-gradient-to-r from-blue-600 to-indigo-800 shadow-lg z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

       {/* Logo */}
      <Link to="/" className="flex items-center">
        <div className="flex items-center gap-3">

          {/* Icon Container */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
            <i className="fas fa-brain text-white text-xl"></i>
          </div>

          {/* Brand Name */}
          <span className="text-white text-3xl font-extrabold tracking-wide">
            SkillLens <span className="text-yellow-400">AI</span>
          </span>

        </div>
      </Link>


        {/* Menu */}
        <div className="hidden md:flex items-center gap-8 text-white font-semibold">

          {isLanding && (
            <>
              <a href="#features" onClick={() => scrollToSection("#features")} className="hover:text-yellow-300 transition duration-300">Features</a>
              <a href="#how" onClick={() => scrollToSection("#how")} className="hover:text-yellow-300 transition duration-300">How It Works</a>
              <a href="#reviews" onClick={() => scrollToSection("#reviews")} className="hover:text-yellow-300 transition duration-300">Reviews</a>
              <a href="#about" onClick={() => scrollToSection("#about")} className="hover:text-yellow-300 transition duration-300">About Us</a>
            </>
          )}

          <Link to="/login" className="hover:text-yellow-300 transition duration-300">
            Login
          </Link>

          <Link to="/register">
            <button className="btn-primary shadow-lg" style={{background: 'var(--color-accent)'}}>
              Get Started Free
            </button>
          </Link>

        </div>
      </div>
    </nav>
  )
}

export default Navbar
