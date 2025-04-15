import { LogIn, UserPlus } from 'lucide-react';

export function AuthButtons() {
  return (
    <div className="flex space-x-4">
      <a
        href="/auth/login"
        className="flex items-center space-x-2 px-4 py-2 bg-white/90 text-gray-700 rounded-full hover:bg-white transition-colors"
      >
        <LogIn size={20} />
        <span>Login</span>
      </a>
      <a
        href="/auth/signup"
        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
      >
        <UserPlus size={20} />
        <span>Sign Up</span>
      </a>
    </div>
  );
} 