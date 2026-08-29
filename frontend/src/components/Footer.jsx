import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react"
import logo from "../assets/logo.png"

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white pt-20 pb-10 overflow-hidden">

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">

        {/* Brand Column */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold tracking-wide">
              SkillLens AI
            </h2>
          </div>

          <p className="text-blue-200 leading-relaxed mb-6">
            Empowering students with intelligent AI-driven career insights,
            performance analytics, and structured growth roadmaps.
          </p>

          <div className="flex gap-5">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
              className="hover:scale-110 transition duration-300 hover:text-green-400">
              <Facebook size={22} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
              className="hover:scale-110 transition duration-300 hover:text-pink-400">
              <Instagram size={22} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
              className="hover:scale-110 transition duration-300 hover:text-blue-300">
              <Linkedin size={22} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
              className="hover:scale-110 transition duration-300 hover:text-purple-400">
              <Twitter size={22} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-6 border-b border-blue-500 pb-2">
            Quick Links
          </h3>

          <ul className="space-y-4 text-blue-200">
            <li>
              <a href="/" className="hover:text-white transition duration-300">
                Home
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-white transition duration-300">
                Features
              </a>
            </li>
            <li>
              <a href="#how" className="hover:text-white transition duration-300">
                How It Works
              </a>
            </li>
            <li>
              <a href="#about" className="hover:text-white transition duration-300">
                About Us
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold mb-6 border-b border-blue-500 pb-2">
            Contact
          </h3>

          <div className="space-y-4 text-blue-200">
            <p>
              Email:
              <a href="mailto:support@skilllens.ai"
                className="ml-2 hover:text-white transition duration-300">
                support@skilllens.ai
              </a>
            </p>

            <p>
              Phone:
              <a href="tel:+919876543210"
                className="ml-2 hover:text-white transition duration-300">
                +91 98765 43210
              </a>
            </p>

            <p>
              Location: Gujarat, India
            </p>
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-lg font-semibold mb-6 border-b border-blue-500 pb-2">
            Stay Updated
          </h3>

          <p className="text-blue-200 mb-4">
            Subscribe to receive career tips and AI insights.
          </p>

          <form className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md input-style"
            />

            <button
              type="submit"
              className="btn-primary hover:shadow-xl transition duration-300"
              style={{background:'var(--color-success)', color:'#06202a'}}>
              Subscribe
            </button>
          </form>
        </div>

      </div>

      {/* Divider */}
      <div className="border-t border-blue-600 mt-16 pt-6 text-center text-blue-300 text-sm">
        © 2026 SkillLens AI. All rights reserved.
      </div>

    </footer>
  )
}

export default Footer
