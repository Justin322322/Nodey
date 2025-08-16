"use client"

import { Github, Heart, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <span className="text-2xl font-bold text-white">nodey.</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Local-first workflow automation that puts privacy and simplicity first.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/editor" className="text-white/60 hover:text-white transition-colors text-sm">
                  Workflow Editor
                </Link>
              </li>
              <li>
                <Link href="/workflows" className="text-white/60 hover:text-white transition-colors text-sm">
                  My Workflows
                </Link>
              </li>
              <li>
                <span className="text-white/40 text-sm">Templates (Coming Soon)</span>
              </li>
              <li>
                <span className="text-white/40 text-sm">Integrations (Coming Soon)</span>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://github.com/Justin322322/Nodey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                >
                  Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/Justin322322/Nodey/blob/main/CONTRIBUTING.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                >
                  Contributing
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/Justin322322/Nodey/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                >
                  Report Issues
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/Justin322322/Nodey/releases" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                >
                  Changelog
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://github.com/Justin322322/Nodey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors text-sm inline-flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </li>
              <li>
                <span className="text-white/40 text-sm">Discord (Coming Soon)</span>
              </li>
              <li>
                <span className="text-white/40 text-sm">Twitter (Coming Soon)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 relative flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Rice grain separator for bottom section */}
          <div className="absolute top-0 left-0 right-0 -translate-y-1/2 overflow-hidden">
            <div className="rice-grain-separator w-full h-[3px]"></div>
          </div>
          <div className="text-white/40 text-sm">
            © {new Date().getFullYear()} Nodey. Open source under MIT License.
          </div>
        </div>
      </div>
    </footer>
  )
}