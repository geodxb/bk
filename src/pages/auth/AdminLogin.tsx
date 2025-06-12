import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('crisdoraodxb@gmail.com');
  const [password, setPassword] = useState('Messi24@'); // Updated default password
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/admin');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md border border-gray-200"
      >
        {/* Interactive Brokers Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/Screenshot 2025-06-07 024813.png" 
              alt="Interactive Brokers" 
              className="h-10 w-auto object-contain"
              style={{ 
                filter: 'none', 
                boxShadow: 'none', 
                background: 'transparent',
                mixBlendMode: 'normal',
                imageRendering: 'crisp-edges',
                WebkitImageRendering: 'crisp-edges',
                msInterpolationMode: 'nearest-neighbor'
              }}
            />
          </div>
          
          {/* Blue accent line */}
          <div className="w-full h-1 bg-blue-600 mb-6"></div>
          
          <h1 className="text-3xl font-normal text-gray-800 text-left">Login</h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User size={20} className="text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg bg-gray-50"
              placeholder="Username"
              required
            />
          </div>
          
          {/* Password Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={20} className="text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg bg-gray-50"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              {showPassword ? (
                <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye size={20} className="text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          
          {/* Need help link */}
          <div className="text-right">
            <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
              Need help?
            </a>
          </div>
          
          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Login'
            )}
          </button>
          
          {/* Welcome message */}
          <div className="text-center">
            <p className="text-gray-600">
              Welcome to your affiliate dashboard
            </p>
          </div>
        </form>
        
        {/* Important Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-yellow-800 font-bold text-sm">!</span>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">IMPORTANT:</span> Due to scheduled maintenance 
                clients may be unable to connect through our web, mobile, and desktop trading platforms.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;