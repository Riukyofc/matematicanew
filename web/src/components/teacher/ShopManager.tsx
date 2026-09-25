"use client";

import { useState, useEffect } from "react";
import { getShopItems, db, type ShopItem } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function ShopManager() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "", description: "", category: "theme" as const,
    price: 100, rarity: "common" as const, icon: "🎨", preview: "", isActive: true
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getShopItems();
      setItems(data.sort((a,b) => a.price - b.price));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []);

  const handleCreate = async () => {
    if (!newItem.name.trim() || !newItem.preview.trim()) return;
    try {
      await addDoc(collection(db, "shopItems"), { ...newItem, createdAt: serverTimestamp() });
      setIsCreating(false);
      loadItems();
    } catch (e: any) { alert("Erro: " + e.message); }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "shopItems", id), { isActive: !current });
      loadItems();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar item da loja?")) return;
    try {
      await deleteDoc(doc(db, "shopItems", id));
      loadItems();
    } catch {}
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-indigo-500 transition";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between p-4 rounded-2xl glass-card-static">
        <div>
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><span>🛒</span> Gerenciador da Loja</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Crie novos temas, bordas e títulos para os alunos comprarem.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-600 transition-colors"
        >
          {isCreating ? "Cancelar" : "＋ Criar Item"}
        </button>
      </div>

      {isCreating && (
        <div className="card p-6 border-l-4 border-indigo-500 animate-fade-down">
          <h4 className="font-bold mb-4">Adicionar Novo Item</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input placeholder="Nome (Ex: Aura de Fogo)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className={inputCls} />
            <input placeholder="Descrição" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className={inputCls} />
            <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as any})} className={inputCls}>
              <option value="theme">Tema (Cor/Fundo)</option>
              <option value="border">Borda Animada</option>
              <option value="title">Título do Perfil</option>
            </select>
            <input type="number" placeholder="Preço (Moedas)" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} className={inputCls} />
            <select value={newItem.rarity} onChange={e => setNewItem({...newItem, rarity: e.target.value as any})} className={inputCls}>
              <option value="common">Comum (Cinza)</option>
              <option value="rare">Raro (Azul)</option>
              <option value="epic">Épico (Roxo)</option>
              <option value="legendary">Lendário (Dourado)</option>
            </select>
            <input placeholder="Valor Interno/Preview (Ex: border-fire)" value={newItem.preview} onChange={e => setNewItem({...newItem, preview: e.target.value})} className={inputCls} />
          </div>
          <button onClick={handleCreate} className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600">
            Adicionar ao Catálogo
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center py-8">Carregando estoque...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className={`p-4 rounded-xl border flex flex-col transition-all ${item.isActive ? 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]' : 'bg-red-500/5 border-red-500/20 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase bg-[var(--color-bg)]`}>
                  {item.category === 'theme' ? 'Tema' : item.category === 'border' ? 'Borda' : 'Título'}
                </span>
                <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${item.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-500' : item.rarity === 'epic' ? 'bg-purple-500/20 text-purple-500' : 'bg-[var(--color-bg-input)]'}`}>
                  {item.rarity}
                </span>
              </div>
              <h4 className="font-bold text-sm mb-1">{item.name}</h4>
              <p className="text-xs text-[var(--color-text-muted)] mb-3 flex-1">{item.description}</p>
              
              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <p className="text-xs font-bold text-yellow-500">💰 {item.price}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleActive(item.id, item.isActive)} className="text-[10px] text-blue-500 hover:underline font-bold">
                    {item.isActive ? 'Pausar' : 'Ativar'}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-[10px] text-red-500 hover:underline font-bold">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
