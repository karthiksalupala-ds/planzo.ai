import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Trash2, DollarSign, Users, Split, BarChart3 } from "lucide-react";

interface GroupMember {
  id: string;
  name: string;
  paid: number;
  spent: number;
}

interface GroupExpenseSplitterProps {
  travelers: number;
  totalBudget: number;
  currentSpend: number;
}

export const GroupExpenseSplitter = ({ travelers, totalBudget, currentSpend }: GroupExpenseSplitterProps) => {
  const [members, setMembers] = useState<GroupMember[]>(
    Array.from({ length: travelers }, (_, i) => ({
      id: `member-${i}`,
      name: `Traveler ${i + 1}`,
      paid: 0,
      spent: 0,
    }))
  );
  const [newName, setNewName] = useState("");
  const [expenses, setExpenses] = useState<{ date: string; description: string; amount: number; paidBy: string; splitAcross: string[] }[]>([]);

  const addExpense = (amount: number, description: string, paidBy: string) => {
    const splitAcross = members.map(m => m.id);
    setExpenses([
      ...expenses,
      {
        date: new Date().toLocaleDateString(),
        description,
        amount,
        paidBy,
        splitAcross,
      },
    ]);

    setMembers(
      members.map(m =>
        m.id === paidBy
          ? { ...m, paid: m.paid + amount }
          : { ...m, spent: m.spent + amount / members.length }
      )
    );
  };

  // Calculate settlements
  const settlements = calculateSettlements(members);

  const perPersonShare = currentSpend / travelers;
  const fairShare = totalBudget / travelers;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-muted-foreground">GROUP SIZE</span>
          </div>
          <div className="text-2xl font-black text-blue-600">{travelers}</div>
          <div className="text-xs text-muted-foreground mt-2">travelers</div>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Split className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-bold text-muted-foreground">FAIR SHARE</span>
          </div>
          <div className="text-2xl font-black text-purple-600">₹{fairShare.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground mt-2">per person</div>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-muted-foreground">CURRENT AVG</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">₹{perPersonShare.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground mt-2">per person</div>
        </motion.div>
      </div>

      {/* Member Balances */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm">Member Balances</h4>
        {members.map((member, idx) => {
          const balance = member.paid - member.spent;
          const owes = balance < 0 ? Math.abs(balance) : 0;
          const isOwed = balance > 0 ? balance : 0;

          return (
            <motion.div
              key={member.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="font-bold text-sm">{member.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Paid: ₹{member.paid.toFixed(0)} | Spent: ₹{member.spent.toFixed(0)}
                  </div>
                </div>
                <button
                  onClick={() => setMembers(members.filter(m => m.id !== member.id))}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Balance Bar */}
              <div className="flex items-center gap-2 mb-2">
                {balance === 0 ? (
                  <div className="flex-1 text-center">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                      ✓ Settled
                    </span>
                  </div>
                ) : owes > 0 ? (
                  <>
                    <div className="flex-1 h-2 bg-red-200 dark:bg-red-900/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="h-full bg-red-500"
                      />
                    </div>
                    <span className="text-sm font-bold text-red-600">Owes ₹{owes.toFixed(0)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold text-emerald-600">Gets ₹{isOwed.toFixed(0)}</span>
                    <div className="flex-1 h-2 bg-emerald-200 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Settlement Instructions */}
      {settlements.length > 0 && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <h4 className="font-bold text-sm text-blue-900 dark:text-blue-200 mb-3">Settlement Instructions</h4>
          <div className="space-y-2">
            {settlements.map((settlement, idx) => (
              <div key={idx} className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-bold">{settlement.from}</span> → <span className="font-bold">{settlement.to}</span>: ₹{settlement.amount.toFixed(0)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Expense */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-border/50">
        <h4 className="font-bold text-sm mb-3">Quick Add Shared Expense</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Amount"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            defaultValue="0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && members.length > 0) {
                const amount = parseFloat((e.target as HTMLInputElement).value);
                addExpense(amount, "Shared expense", members[0].id);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
          <input
            type="text"
            placeholder="Description"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all">
            <DollarSign className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* AI Suggestion */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
        <div className="flex gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
          <h4 className="font-bold text-sm">AI Expense Insight</h4>
        </div>
        <div className="text-xs leading-relaxed text-muted-foreground">
          For {travelers} travelers, suggest tracking food separately (splits easily) vs. hotel/activities (might be paid by one person). Digital payments (UPI/Google Pay) make settlement instant.
        </div>
      </div>
    </div>
  );
};

function calculateSettlements(members: GroupMember[]) {
  const settlements: { from: string; to: string; amount: number }[] = [];
  const balances = members.map(m => ({ name: m.name, balance: m.paid - m.spent }));

  let debtors = balances.filter(b => b.balance < 0);
  let creditors = balances.filter(b => b.balance > 0);

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount,
    });

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) debtors.shift();
    if (creditor.balance < 0.01) creditors.shift();
  }

  return settlements;
}
