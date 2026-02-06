import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your CycleWise trading assistant. I can help you with trading strategies, cycle tracking, and performance analysis. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response (replace with actual AI API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    // Dashboard & Overview
    if (input.includes("dashboard") || input.includes("overview")) {
      return "The Dashboard is your central hub! Here you can:\n\n📊 View performance metrics (P&L, win rate, average R)\n🌙 Track your cycle phase and see recommendations\n⚡ Monitor your XP and rank progress\n🔥 Check your login and trading streaks\n📝 Quick-access to recent trades\n🏆 See leaderboard previews\n\nWhat specific dashboard feature would you like to know more about?";
    }

    // Trade Journal
    if (input.includes("journal") || input.includes("log trade") || input.includes("add trade")) {
      return "The Trade Journal tracks ALL your trading details:\n\n✅ Entry/exit prices and timestamps\n📈 Direction (long/short) and R-multiple\n🎯 Strategy used and rule compliance\n🌙 Cycle phase at trade time\n💭 Emotions, energy, and notes\n📸 Screenshots and attachments\n\nThis data powers your statistics, AI insights, and helps you spot patterns. To add a trade, use the 'New Trade' button or QuickAdd on Dashboard!";
    }

    // Cycle Tracker
    if (input.includes("cycle") || input.includes("phase") || input.includes("period") || input.includes("menstrual")) {
      return "Cycle Tracking is CycleWise's superpower! Track:\n\n🩸 Period days and cycle length\n😴 Sleep quality (1-10)\n⚡ Energy levels (1-10)\n🎯 Focus/clarity (1-10)\n😰 Stress levels (1-10)\n😊 Mood (1-10)\n💊 Symptoms (cramps, bloating, etc.)\n\nYour trading performance is analyzed by cycle phase:\n• Menstruation (Day 1-5)\n• Follicular (Day 6-13)\n• Ovulation (Day 14-16)\n• Luteal (Day 17-28)\n\nThis helps you identify when you trade best!";
    }

    // Statistics & Analytics
    if (input.includes("statistics") || input.includes("stats") || input.includes("analytics") || input.includes("performance")) {
      return "Statistics give you deep insights:\n\n📊 Overall Performance:\n• Total P&L, win rate, average R\n• Trade distribution by result\n• Best/worst trading days\n\n🌙 Cycle-Based Analysis:\n• Win rate per cycle phase\n• R-multiple by phase\n• Energy/mood correlation\n\n📅 Time Analysis:\n• Daily, weekly, monthly breakdowns\n• Session time performance\n• Weekday patterns\n\n🎯 Strategy Performance:\n• Win rate per strategy\n• R-multiple comparison\n• Rule compliance scores\n\nNeed help interpreting your stats?";
    }

    // Strategies & Strategy Builder
    if (input.includes("strategy") || input.includes("strategies") || input.includes("checklist") || input.includes("setup")) {
      return "The Strategy Builder helps you stay disciplined:\n\n✅ Create detailed strategy checklists\n📋 Pre-entry confirmations (trend, S/R, patterns)\n⚙️ Entry rules (specific conditions)\n🎯 Exit rules (TP, SL, management)\n📝 Optional post-trade review questions\n\n🎨 Features:\n• Color-coding for visual recognition\n• Emoji support for quick scanning\n• Compliance tracking in journal\n• Performance stats per strategy\n\nStrategies you follow show higher win rates - build yours in the Strategies page!";
    }

    // Challenges & Leaderboards
    if (input.includes("challenge") || input.includes("leaderboard") || input.includes("compete") || input.includes("ranking")) {
      return "Weekly Challenges let you compete and grow:\n\n🏆 Leaderboards:\n• Profit Leaders (highest P&L)\n• Strategy Discipline (rule compliance)\n• Risk Masters (lowest drawdown)\n• Cycle-Aligned (phase-aware trading)\n\n⚡ XP Rankings:\n• Weekly, Monthly, All-Time\n• Earn XP from trades, streaks, insights\n\n🏅 Badges to Earn:\n• Miss Discipline (100% rules for 30 days)\n• Risk Queen (max 3% DD monthly)\n• Cycle Master (best phase trading)\n• Consistency Queen (20+ profitable days)\n• Comeback Girl (recover from 10% DD)\n\nCheck Challenges page to join!";
    }

    // XP System & Gamification
    if (input.includes("xp") || input.includes("rank") || input.includes("level") || input.includes("streak")) {
      return "The XP & Ranking System rewards consistency:\n\n⚡ Earn XP From:\n• Compliant trades (+50 XP)\n• Login streaks (+10/day)\n• Trading streaks (+20/day)\n• AI insights interaction (+5)\n• Breaking rules (-30 XP)\n\n🏅 Ranks (by total XP):\n• 🥉 Bronze (0-999)\n• 🥈 Silver (1,000-2,999)\n• 🥇 Gold (3,000-5,999)\n• 💎 Platinum (6,000-9,999)\n• 💠 Diamond (10,000+)\n\n⚠️ Maintenance: Earn monthly XP to keep rank (20% penalty if you don't meet requirement)!\n\nCheck your XP bar on Dashboard!";
    }

    // AI Insights
    if (input.includes("ai insight") || input.includes("analysis") || input.includes("recommendation")) {
      return "AI Insights analyze your data weekly:\n\n🤖 What's Analyzed:\n• Trading patterns and habits\n• Cycle phase correlations\n• Rule compliance trends\n• Risk management effectiveness\n• Emotional state impacts\n\n💡 You Get:\n• Personalized recommendations\n• Pattern recognition alerts\n• Improvement suggestions\n• Warnings about risky behaviors\n\nView insights on AI Insights page or Dashboard cards. Interact with them to earn +5 XP!";
    }

    // Prop Firm Integration
    if (input.includes("prop firm") || input.includes("propfirm") || input.includes("ftmo") || input.includes("funded")) {
      return "Prop Firm Accounts tracking:\n\n🏦 Supported Firms:\n• FTMO, MyFundedFutures, E8 Funding\n• TopTier Trader, The Funded Trader\n• Funded Next, Funded Trading Plus\n• Blue Guardian, and more!\n\n📊 Track:\n• Account balance and equity\n• Daily/total drawdown\n• Profit targets and progress\n• Active challenges\n\n🔐 Secure Integration:\n• Read-only MT4/MT5 access\n• Encrypted credentials\n• Auto-sync with backend\n\nManage on Prop Firm Accounts page!";
    }

    // Settings & Customization
    if (input.includes("setting") || input.includes("customize") || input.includes("configure")) {
      return "Settings let you personalize CycleWise:\n\n👤 Profile:\n• Name, avatar, bio\n• Trading style and goals\n\n🎨 Appearance:\n• Light/dark mode\n• Theme colors\n\n⚠️ Risk Parameters:\n• Daily loss limit\n• Max position size\n• Risk % per trade\n\n🔔 Notifications:\n• XP milestones\n• Streak reminders\n• AI insight alerts\n\n🌙 Cycle Settings:\n• Average cycle length\n• Period duration\n• Phase preferences\n\nAccess via Settings in sidebar!";
    }

    // Data Privacy & Security
    if (input.includes("privacy") || input.includes("data") || input.includes("secure") || input.includes("safe")) {
      return "Your data is safe and private:\n\n🔒 Security:\n• All data encrypted\n• Supabase secure backend\n• Row-level security policies\n• No data sharing without consent\n\n👁️ Challenge Privacy:\n• Choose public/private leaderboard\n• Control name visibility\n• Opt-in for competitions\n\n💾 Your Control:\n• Export all data anytime\n• Delete account option\n• Local storage for offline mode\n\nManage in Settings > Privacy!";
    }

    // Risk Management
    if (input.includes("risk") || input.includes("management") || input.includes("stop loss") || input.includes("position size")) {
      return "Proper risk management is crucial! Here are the essentials:\n\n⚠️ Golden Rules:\n• Never risk more than 1-2% per trade\n• ALWAYS set stop loss before entry\n• Use position sizing calculators\n• Respect daily/weekly loss limits\n• Track your drawdown religiously\n\n📊 In CycleWise:\n• Set risk limits in Settings\n• Track compliance in journal\n• Get warnings when approaching limits\n• See risk metrics in Statistics\n\nYour account safety depends on this!";
    }

    // General Help
    if (input.includes("help") || input.includes("what can you do") || input.includes("features")) {
      return "I can help you with ALL CycleWise features:\n\n📱 Pages:\n• Dashboard - Overview & quick actions\n• Journal - Log and review trades\n• Cycle Tracker - Track phases & wellbeing\n• Statistics - Deep performance analysis\n• Strategies - Build rule checklists\n• Challenges - Compete & earn badges\n• AI Insights - Personalized recommendations\n• Prop Firms - Manage funded accounts\n• Settings - Customize your experience\n\n💡 Ask me about:\n✨ How to use any feature\n📊 What data is tracked\n🎯 Best practices\n⚡ XP and ranking system\n🌙 Cycle-based trading\n\nWhat do you want to explore?";
    }

    // Default response
    return "Great question! CycleWise combines trading psychology with menstrual cycle tracking.\n\n🌟 Core Features:\n• Trade journaling with emotion tracking\n• Cycle phase analysis\n• Strategy builder & compliance\n• XP system & leaderboards\n• AI-powered insights\n• Prop firm integration\n\n💬 Try asking about:\n• \"How do I track my cycle?\"\n• \"What is the XP system?\"\n• \"How do challenges work?\"\n• \"Show me statistics features\"\n\nWhat would you like to know?";
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-glow hover:shadow-xl transition-all duration-300"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        {/* Unread indicator (optional) */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center"
          >
            <Sparkles className="h-3 w-3 text-destructive-foreground" />
          </motion.div>
        )}
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-2">
              <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-secondary/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  CycleWise AI Assistant
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Your personal trading coach
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <ScrollArea ref={scrollAreaRef} className="h-[400px] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              message.role === "user"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-3">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                animate={{ y: [0, -8, 0] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: i * 0.1,
                                }}
                                className="h-2 w-2 rounded-full bg-muted-foreground/50"
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask me anything..."
                      className="flex-1"
                      disabled={isTyping}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!inputValue.trim() || isTyping}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                  <p className="mt-2 text-[10px] text-center text-muted-foreground">
                    AI responses are for guidance only. Always do your own research.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
