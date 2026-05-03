import React from 'react';
import { motion } from 'framer-motion';

const FloatingCard = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl transition-colors hover:border-white/[0.15] ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default FloatingCard;
