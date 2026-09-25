"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShopItem, getShopItems, purchaseItem, equipItem, unequipItem } from "@/lib/firebase";
import { useToast } from "@/components/Toast";

const RARITY_CONFIG: Record<string, { label: string; class: string; bgClass: string }> = {
  common: { label: "Comum", class: "rarity-common", bgClass: "bg-slate-500/5 border-slate-500/10" },
  rare: { label: "Raro", class: "rarity-rare", bgClass: "bg-blue-500/5 border-blue-500/10" },
  epic: { label: "Épico", class: "rarity-epic", bgClass: "bg-purple-500/5 border-purple-500/10" },
  legendary: { label: "Lendário", class: "rarity-legendary", bgClass: "bg-yellow-500/5 border-yellow-500/10" },
};

const CATEGORY_INFO: Record<string, { icon: string; label: string; desc: string }> = {
  theme: { icon: "🎨", label: "Temas de Interface", desc: "Altere as cores da plataforma" },
  border: { icon: "✨", label: "Bordas Animadas", desc: "Efeitos no avatar do perfil" },
  title: { icon: "👑", label: "Títulos de Perfil", desc: "Exiba seu status no ranking" },
};

export default function ShopPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "theme" | "border" | "title">("all");

  const loadItems = useCallback(async () => {
    try {
      const data = await getShopItems();
      setItems(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  if (!user || !profile) return null;

  const coins = Number(profile.coins) || 0;
  const ownedItems = (profile.ownedItems as string[]) || [];

  const handlePurchase = async (item: ShopItem) => {
    setActionLoading(item.id);
    try {
      const res = await purchaseItem(user.uid, item);
      addToast(res.success ? "achievement" : "error", res.message);
      if (res.success) {
        await refreshProfile();
        loadItems();
      }
    } catch {
      addToast("error", "Erro ao comprar item");
    }
    setActionLoading(null);
  };

  const handleEquip = async (item: ShopItem) => {
    setActionLoading(item.id);
    try {
      await equipItem(user.uid, item);
      addToast("success", `${item.name} equipado!`);
      await refreshProfile();
    } catch {
      addToast("error", "Erro ao equipar");
    }
    setActionLoading(null);
  };

  const handleUnequip = async (category: "theme" | "border" | "title") => {
    try {
      await unequipItem(user.uid, category);
      addToast("info", "Item desequipado");
      await refreshProfile();
    } catch {
      addToast("error", "Erro ao desequipar");
    }
  };

  const categories = ["theme", "border", "title"] as const;
  const filteredItems = filter === "all" ? items : items.filter(i => i.category === filter);

  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = filteredItems.filter(i => i.category === cat);
    return acc;
  }, {} as Record<string, ShopItem[]>);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛍️</span>
          <div>
            <h1 className="text-2xl font-black">Lojinha</h1>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>Personalize seu perfil!</p>
          </div>
        </div>
        <div className="card-flat px-4 py-2.5 flex items-center gap-2.5 rounded-xl">
          <span className="text-xl">🪙</span>
          <div>
            <p className="text-xl font-black" style={{ color: "#d4a017" }}>{coins}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Moedas</p>
          </div>
        </div>
      </div>

      {/* Rarity Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-bold animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <span className="text-[var(--color-text-muted)]">Raridades:</span>
        {Object.entries(RARITY_CONFIG).map(([key, val]) => (
          <span key={key} className={`badge ${val.class}`}>{val.label}</span>
        ))}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filter === "all" ? "tab-active" : "tab-inactive"}`}>
          Todos ({items.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filter === cat ? "tab-active" : "tab-inactive"}`}
          >
            <span>{CATEGORY_INFO[cat].icon}</span>
            {CATEGORY_INFO[cat].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-56 skeleton" />)}
        </div>
      ) : (
        <div className="space-y-10">
          {categories.map(cat => {
            const catItems = groupedItems[cat];
            if (!catItems || catItems.length === 0) return null;
            const info = CATEGORY_INFO[cat];
            const hasEquipped = 
              (cat === "theme" && profile.equippedTheme) ||
              (cat === "border" && profile.equippedBorder) ||
              (cat === "title" && profile.equippedTitle);

            return (
              <div key={cat} className="animate-fade-up">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <h2 className="text-xl font-black">{info.label}</h2>
                      <p className="text-xs text-[var(--color-text-muted)]">{info.desc}</p>
                    </div>
                  </div>
                  {Boolean(hasEquipped) && (
                    <button 
                      onClick={() => handleUnequip(cat as "theme" | "border" | "title")} 
                      className="text-xs font-bold text-red-500 hover:underline cursor-pointer px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      Desequipar atual
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {catItems.map(item => {
                    const isOwned = ownedItems.includes(item.id);
                    const isEquipped = profile.equippedTheme === item.preview || profile.equippedBorder === item.preview || profile.equippedTitle === item.preview;
                    const canAfford = coins >= item.price;
                    const isProcessing = actionLoading === item.id;
                    const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;

                    return (
                      <div 
                        key={item.id} 
                        className={`glass-card p-5 flex flex-col relative overflow-hidden group ${
                          isEquipped ? "ring-2 ring-emerald-500/50" : ""
                        }`}
                      >
                        {/* Equipped badge */}
                        {isEquipped && (
                          <div className="absolute top-3 right-3 badge badge-success animate-pop-in">
                            ✓ Equipado
                          </div>
                        )}

                        {/* Owned indicator */}
                        {isOwned && !isEquipped && (
                          <div className="absolute top-3 right-3 badge badge-info">
                            Adquirido
                          </div>
                        )}

                        {/* Icon */}
                        <div className="text-4xl mb-3 text-center group-hover:animate-float transition-all">{item.icon}</div>
                        
                        {/* Info */}
                        <div className="text-center mb-4 flex-1">
                          <h3 className="font-black text-base mb-1">{item.name}</h3>
                          <p className="text-[11px] text-[var(--color-text-secondary)] leading-snug mb-2">{item.description}</p>
                          <span className={`badge ${rarity.class}`}>
                            {rarity.label}
                          </span>
                        </div>

                        {/* Action */}
                        <div className="mt-auto">
                          {isOwned ? (
                            <button
                              disabled={isEquipped || isProcessing}
                              onClick={() => handleEquip(item)}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isEquipped 
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-not-allowed" 
                                  : "btn-primary"
                              }`}
                            >
                              {isProcessing ? "Aguarde..." : isEquipped ? "Em uso" : "Equipar"}
                            </button>
                          ) : (
                            <button
                              disabled={!canAfford || isProcessing}
                              onClick={() => handlePurchase(item)}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                !canAfford 
                                  ? "bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] cursor-not-allowed border border-[var(--color-border)]" 
                                  : "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md shadow-yellow-500/20 hover:shadow-lg hover:shadow-yellow-500/30"
                              }`}
                            >
                              {isProcessing ? "Comprando..." : (
                                <>
                                  <span>Comprar</span>
                                  <span className="font-black">{item.price} 🟡</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4 animate-float">🏪</div>
              <p className="text-lg font-bold text-[var(--color-text-secondary)]">Nenhum item disponível</p>
              <p className="text-sm text-[var(--color-text-muted)]">O professor ainda não adicionou itens à loja</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
