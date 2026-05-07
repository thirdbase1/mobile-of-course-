'use client'

import { useState, useRef, useEffect } from 'react'
import { MODELS } from '@/lib/store'
import { Cpu, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

interface ModelSelectorProps {
  model: string
  onModelChange: (model: string) => void
}

export default function ModelSelector({ model, onModelChange }: ModelSelectorProps) {
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const filteredModels = MODELS.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.provider.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showModal])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowModal(!showModal)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-all backdrop-blur-md hover:bg-white/10 hover:border-white/20"
      >
        <Cpu className="w-3 h-3" />
        {MODELS.find(m => m.id === model)?.name || model}
        <ChevronDown className={clsx("w-3 h-3 transition-transform duration-200", showModal && "rotate-180")} />
      </button>

      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-[99]"
            />

            {/* Modal */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="fixed z-[100] bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              style={{
                top: buttonRef.current ? buttonRef.current.getBoundingClientRect().top - 400 : 'auto',
                left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left : 'auto',
                width: '384px',
              }}
            >
              {/* Header */}
              <div className="sticky top-0 p-3 border-b border-white/5 bg-[#18181b]/95 backdrop-blur-sm z-20">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Models List */}
              <div className="max-h-96 overflow-y-auto py-2">
                {filteredModels.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[10px] text-muted-foreground/40">
                    No models found
                  </div>
                ) : (
                  filteredModels.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onModelChange(m.id)
                        setShowModal(false)
                        setSearchTerm('')
                      }}
                      className={clsx(
                        "w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-between group mx-0",
                        model === m.id ? "text-white bg-white/10" : "text-muted-foreground/60"
                      )}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="truncate">{m.name}</span>
                        <span className="text-[8px] opacity-40 font-mono tracking-tighter group-hover:opacity-60">{m.provider}</span>
                      </div>
                      {model === m.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 ml-2"
                        />
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
