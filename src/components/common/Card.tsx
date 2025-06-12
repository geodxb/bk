import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}

const Card = ({ children, title, className = '', onClick }: CardProps) => {
  return (
    <motion.div
      whileHover={onClick ? { y: -2, scale: 1.01 } : {}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-blue-200' : ''} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="px-6 py-5 border-b border-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className={title ? "p-6" : "p-6"}>{children}</div>
    </motion.div>
  );
};

export default Card;