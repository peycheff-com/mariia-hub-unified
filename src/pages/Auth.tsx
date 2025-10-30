import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast aria-live="polite" aria-atomic="true"({
          title: t('auth.success'),
          description: t('auth.welcomeBack'),
        });
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) throw error;

        toast aria-live="polite" aria-atomic="true"({
          title: t('auth.checkEmail'),
          description: t('auth.confirmEmail'),
        });
      }
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('auth.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cocoa flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-pearl/70 hover:text-pearl mb-6 -ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('auth.backHome')}
        </Button>

        <div className="glass-card rounded-3xl p-8 md:p-12 backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-serif text-pearl mb-2">
              {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
            </h1>
            <p className="text-pearl/60">
              {isLogin ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-xs text-pearl/70 uppercase tracking-wider">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pearl/50" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 !bg-[hsl(20_8%_12%_/_0.9)] backdrop-blur-sm border border-pearl/30 rounded-2xl !text-[hsl(33_15%_96%)] placeholder:text-pearl/40 focus:outline-none focus:border-champagne/50 focus:ring-1 focus:ring-champagne/20 transition-all"
                    placeholder={t('auth.fullNamePlaceholder')}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs text-pearl/70 uppercase tracking-wider">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pearl/50" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 !bg-[hsl(20_8%_12%_/_0.9)] backdrop-blur-sm border border-pearl/30 rounded-2xl !text-[hsl(33_15%_96%)] placeholder:text-pearl/40 focus:outline-none focus:border-champagne/50 focus:ring-1 focus:ring-champagne/20 transition-all"
                  placeholder={t('auth.emailPlaceholder')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs text-pearl/70 uppercase tracking-wider">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pearl/50" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 !bg-[hsl(20_8%_12%_/_0.9)] backdrop-blur-sm border border-pearl/30 rounded-2xl !text-[hsl(33_15%_96%)] placeholder:text-pearl/40 focus:outline-none focus:border-champagne/50 focus:ring-1 focus:ring-champagne/20 transition-all"
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-pearl/50 hover:text-pearl transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? t('auth.loading') : isLogin ? t('auth.signIn') : t('auth.signUp')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-pearl/70 hover:text-champagne transition-colors"
            >
              {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
