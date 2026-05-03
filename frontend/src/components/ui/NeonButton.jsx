import React from 'react';
import { motion } from 'framer-motion';

const NeonButton = ({ children, onClick, type = 'button', disabled = false, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600',
    outline: 'bg-transparent border border-blue-600 text-blue-500 hover:bg-blue-600/10 shadow-[inset_0_0_10px_rgba(37,99,235,0.1)]',
    ghost: 'bg-transparent hover:bg-white/5 text-slate-400 hover:text-white',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default NeonButton;
