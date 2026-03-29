import { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 px-4 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/10 via-background to-background relative overflow-hidden">
      
      {/* Decorative Background Blobs */}
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] -z-10 animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10 animate-pulse-slow pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-[900px] min-h-[600px] bg-card/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-secondary/10 overflow-hidden border border-border/50 transition-all duration-700">
        
        {/* === SIGN IN CONTAINER === */}
        <div className={`absolute top-0 left-0 w-full md:w-1/2 h-full transition-all duration-700 ease-in-out z-20 flex flex-col justify-center px-8 sm:px-14 bg-card md:bg-transparent ${!isLogin ? 'md:translate-x-[100%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-2 text-foreground">Đăng Nhập</h1>
            <p className="text-muted-foreground font-medium">Chào mừng bạn quay lại với IT Compass</p>
          </div>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-secondary transition-colors" />
              <input type="email" placeholder="Email của bạn" className="w-full pl-12 pr-4 py-4 bg-muted/50 border-transparent rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:bg-background transition-all font-medium outline-none text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-secondary transition-colors" />
              <input type="password" placeholder="Mật khẩu" className="w-full pl-12 pr-4 py-4 bg-muted/50 border-transparent rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:bg-background transition-all font-medium outline-none text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between text-sm py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-secondary focus:ring-secondary bg-muted/50 border-border/50" />
                <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">Ghi nhớ</span>
              </label>
              <a href="#" className="font-bold text-secondary hover:underline underline-offset-4">Quên mật khẩu?</a>
            </div>
            <button className="w-full bg-foreground text-background font-black py-4 rounded-2xl hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 shadow-xl shadow-foreground/5 active:scale-[0.98]">
              Đăng Nhập
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-bold tracking-wider rounded-full">Hoặc đăng nhập bằng</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Google Button */}
              <button className="relative overflow-hidden group flex items-center justify-center gap-2 py-3 px-4 border-2 border-border/50 bg-background rounded-2xl font-bold transition-all duration-300 active:scale-[0.98] hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-600 to-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out z-0"></div>
                <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                  <svg className="w-5 h-5 group-hover:brightness-0 group-hover:invert transition-all duration-300" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Google
                </span>
              </button>
              
              {/* Facebook Button */}
              <button className="relative overflow-hidden group flex items-center justify-center gap-2 py-3 px-4 border-2 border-border/50 bg-background rounded-2xl font-bold transition-all duration-300 active:scale-[0.98] hover:border-[#1877F2] hover:shadow-lg hover:shadow-[#1877F2]/20">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-700 to-[#1877F2] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out z-0"></div>
                <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                  <svg className="w-5 h-5 text-[#1877F2] group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 5.96 4.39 10.9 10.13 11.9v-8.43H7.08v-3.47h3.05V9.41c0-3.02 1.8-4.7 4.56-4.7 1.31 0 2.68.23 2.68.23v2.96h-1.5c-1.48 0-1.93.92-1.93 1.86v2.24h3.32l-.53 3.47h-2.8v8.43C19.61 22.97 24 18.03 24 12.07z"/>
                  </svg>
                  Facebook
                </span>
              </button>
            </div>
          </div>

          <div className="mt-8 text-center md:hidden pb-4">
            <p className="text-muted-foreground font-medium text-sm">Chưa có tài khoản?</p>
            <button onClick={() => setIsLogin(false)} className="font-bold text-secondary mt-1 hover:underline underline-offset-4">Đăng Ký Ngay</button>
          </div>
        </div>

        {/* === SIGN UP CONTAINER === */}
        <div className={`absolute top-0 left-0 w-full md:w-1/2 h-full transition-all duration-700 ease-in-out z-10 flex flex-col justify-center px-8 sm:px-14 bg-card md:bg-transparent ${!isLogin ? 'md:translate-x-[100%] opacity-100 z-20 md:z-20' : 'translate-x-0 opacity-0 pointer-events-none'}`}>
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-2 text-foreground">Đăng Ký</h1>
            <p className="text-muted-foreground font-medium">Bắt đầu hành trình của bạn ngay hôm nay</p>
          </div>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-secondary transition-colors" />
              <input type="text" placeholder="Họ và tên" className="w-full pl-12 pr-4 py-4 bg-muted/50 border-transparent rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:bg-background transition-all font-medium outline-none text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-secondary transition-colors" />
              <input type="email" placeholder="Email của bạn" className="w-full pl-12 pr-4 py-4 bg-muted/50 border-transparent rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:bg-background transition-all font-medium outline-none text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-secondary transition-colors" />
              <input type="password" placeholder="Mật khẩu" className="w-full pl-12 pr-4 py-4 bg-muted/50 border-transparent rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:bg-background transition-all font-medium outline-none text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="flex items-center text-sm py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-secondary focus:ring-secondary bg-muted/50 border-border/50" />
                <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">Tôi đồng ý với <a href="#" className="font-bold text-secondary hover:underline">Điều khoản</a></span>
              </label>
            </div>
            <button className="w-full mt-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-black py-4 rounded-2xl hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300 active:scale-[0.98]">
              Tạo Tài Khoản
            </button>
          </form>

          <div className="mt-8 text-center md:hidden pb-4">
            <p className="text-muted-foreground font-medium text-sm">Đã có tài khoản?</p>
            <button onClick={() => setIsLogin(true)} className="font-bold text-secondary mt-1 hover:underline underline-offset-4">Đăng Nhập</button>
          </div>
        </div>

        {/* === DESKTOP OVERLAY SLIDER === */}
        <div className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-50 ${!isLogin ? '-translate-x-full' : 'translate-x-0'}`}>
          {/* Inner Background (moves in reverse to stay pinned) */}
          <div className={`absolute top-0 left-[-100%] w-[200%] h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-secondary to-secondary transition-transform duration-700 ease-in-out ${!isLogin ? 'translate-x-1/2' : 'translate-x-0'}`}>
            
            {/* Background Texture/Noise */}
            <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            {/* Left Overlay Content (Visible when registering) */}
            <div className={`absolute top-0 right-1/2 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center text-primary-foreground transition-transform duration-700 ease-in-out ${!isLogin ? 'translate-x-0' : '-translate-x-[20%]'}`}>
              <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">Mừng Bạn<br/>Trở Lại!</h2>
              <p className="text-base lg:text-lg font-medium opacity-90 mb-10 max-w-[280px]">
                Để giữ kết nối với chúng tôi, vui lòng đăng nhập bằng thông tin cá nhân của bạn.
              </p>
              <button 
                onClick={() => setIsLogin(true)} 
                className="px-10 py-3 rounded-2xl border-2 border-white/40 hover:bg-white hover:border-white text-white hover:text-secondary flex items-center gap-2 font-black transition-all duration-300 active:scale-95 shadow-lg shadow-black/5"
              >
                Đăng Nhập Ngay <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Overlay Content (Visible when logging in) */}
            <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center text-primary-foreground transition-transform duration-700 ease-in-out ${!isLogin ? 'translate-x-[20%]' : 'translate-x-0'}`}>
              <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">Chào Bạn<br/>Mới!</h2>
              <p className="text-base lg:text-lg font-medium opacity-90 mb-10 max-w-[280px]">
                Nhập thông tin cá nhân và bắt đầu hành trình khám phá thế giới IT cùng chúng tôi.
              </p>
              <button 
                onClick={() => setIsLogin(false)} 
                className="px-8 py-3 rounded-2xl bg-white text-secondary flex items-center gap-2 hover:shadow-xl hover:shadow-black/20 font-black transition-all duration-300 active:scale-95"
              >
                Tạo Tài Khoản <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
