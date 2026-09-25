"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { onAuthChange, getUserProfile, loginWithGoogle } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  profile: Record<string, unknown> | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  loginWithGoogle: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  loginWithGoogle: async () => { throw new Error("not initialized"); }
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      try {
        const p = await getUserProfile(user.uid);
        if (p) {
          const { getMissionStats, updateUserProfile } = await import("@/lib/firebase");
          const { increment } = await import("firebase/firestore");
          const { checkNewAchievements } = await import("@/lib/achievements");
          
          const stats = await getMissionStats(user.uid);
          const newAchievs = checkNewAchievements(p, stats);
          
          if (newAchievs.length > 0) {
            const unlockedIds = [...(p.unlockedAchievements as string[] || []), ...newAchievs.map(a => a.id)];
            const totalXp = newAchievs.reduce((sum, a) => sum + a.xpReward, 0);
            
            await updateUserProfile(user.uid, {
              unlockedAchievements: unlockedIds,
              xp: increment(totalXp)
            });
            
            p.unlockedAchievements = unlockedIds;
            p.xp = (Number(p.xp) || 0) + totalXp;
            
            // Dispara evento para o Toast ou animação
            newAchievs.forEach(a => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("achievement_unlocked", { detail: a }));
              }
            });
          }
        }
        setProfile(p);
      } catch (err) {
        console.error("Error refreshing profile", err);
      }
    }
  };

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        try {
          const p = await getUserProfile(u.uid);
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}
