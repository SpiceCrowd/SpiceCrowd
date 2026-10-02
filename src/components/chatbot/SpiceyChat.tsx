"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/products";
import { useCart } from "@/components/cart/CartProvider";

type Message = { id: number; from: "spicey" | "customer"; text: string };

const starterMessages: Message[] = [
  { id: 1, from: "spicey", text: "Hi, I am Spicey. Ask me about spices, stock, delivery, orders, returns, or checkout." },
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

type ChatProduct = { title: string; price: string; slug: string };

function answerQuestion(input: string, cartCount: number, products: ChatProduct[]) {
  const question = normalize(input);
  const productNames = products.map((product) => product.title);
  if (!question) return "Type a question and I will help you find the right answer.";

  if (/kolli hills|kolli hill/.test(question)) {
    return "Kolli Hills is a hill region in Tamil Nadu known for its farms, aromatic spices, coffee, honey, and traditional ingredients. Spice Crowd sources products connected to this region, including turmeric, black pepper, cinnamon, cloves, ginger, coffee, and honey. Our store is at No. 02/89, Solakkadu, Kolli Hills, Tamil Nadu 637415. Visit the catalog to explore the products: /products.";
  }
  if (/\b(hello|hi|hey|help)\b/.test(question)) {
    return "I can help with product recommendations, spice usage, stock, delivery, payment, cart, orders, reviews, wishlist, and returns.";
  }
  if (/cart|basket/.test(question)) {
    return cartCount ? `You have ${cartCount} item${cartCount === 1 ? "" : "s"} in your cart. You can review it here: /cart` : "Your cart is empty. Browse the catalog and add a spice to get started.";
  }
  if (/return|refund|damaged|wrong product/.test(question)) {
    return "For a damaged, incorrect, or quality issue, submit your order ID and email here: /returns. Your request can then be reviewed by our support team.";
  }
  if (/delivery|shipping|how long|arrive/.test(question)) {
    return "Standard delivery usually takes 3-5 business days. Express delivery usually takes 1-2 days. Shipping cost is shown at checkout.";
  }
  if (/where.*from|origin|source/.test(question)) {
    return "Kolli Hills is a hill region in Tamil Nadu known for its farms, aromatic spices, coffee, honey, and traditional ingredients. Spice Crowd sources products connected to this region, including turmeric, black pepper, cinnamon, cloves, ginger, coffee, and honey. Our store is at No. 02/89, Solakkadu, Kolli Hills, Tamil Nadu 637415. Visit the catalog to explore the products: /products.";
  }
  if (/payment|pay|upi|card|razorpay|cash/.test(question)) {
    return "Checkout supports card, UPI, netbanking, and wallets. The current local app uses demo payment processing until a live gateway is configured.";
  }
  if (/review|rating|feedback/.test(question)) {
    return "You can submit a product rating and review here: /reviews. Choose the product, select 1-5 stars, and describe your experience.";
  }
  if (/wishlist|save|favorite|favourite/.test(question)) {
    return "Tap the heart on any product card to save it. Your saved spices are available here: /wishlist.";
  }
  if (/order|track|where.*order|status/.test(question)) {
    return "You can see your order history and tracking from My Account. Open /account/orders, then select an order to view its invoice and status.";
  }
  if (/stock|available|out of stock|quantity|how many/.test(question)) {
    return "Each product starts with up to 10 available units. The product card shows the current stock, and checkout blocks quantities above what is available.";
  }
  if (/recommend|suggest|best|spice for|buy/.test(question)) {
    return `Popular choices include ${productNames.slice(0, 3).join(", ")}. Open the catalog to compare prices, ratings, stock, and product details: /products.`;
  }
  if (/pepper/.test(question)) {
    const pepperProducts = products.filter((product) => product.title.toLowerCase().includes("pepper"));
    if (pepperProducts.length > 0) {
      return `Pepper products and prices: ${pepperProducts.map((product) => `${product.title} - ${product.price} (/products/${product.slug})`).join("; ")}.`;
    }
    return "I could not find a pepper product right now. Please browse the catalog: /products.";
  }
  if (/turmeric|pepper|chilli|chili|cinnamon|clove|ginger|masala|coffee/.test(question)) {
    const match = productNames.find((name) => question.includes(name.toLowerCase().split(" ")[0]));
    return match ? `${match} is available in our catalog. Open /products to see its price, stock, and details.` : "I found several related spices in the catalog. Open /products and use the search or price filters to compare them.";
  }
  if (/price|cost|cheap|under/.test(question)) {
    return "You can sort products by price and filter by a maximum price from the catalog: /products.";
  }
  return "I can help with products, recommendations, stock, delivery, payment, orders, reviews, wishlist, and returns. What would you like to know?";
}

export default function SpiceyChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const { cartCount } = useCart();
  const products = useMemo(() => getProducts().map((product) => ({ title: product.title, price: product.price, slug: product.slug })), []);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-spicey-assistant", handleOpen);
    return () => window.removeEventListener("open-spicey-assistant", handleOpen);
  }, []);

  function sendMessage(event?: React.FormEvent) {
    event?.preventDefault();
    const question = input.trim();
    if (!question) return;
    const nextId = messages.length + 1;
    setMessages((current) => [
      ...current,
      { id: nextId, from: "customer", text: question },
      { id: nextId + 1, from: "spicey", text: answerQuestion(question, cartCount, products) },
    ]);
    setInput("");
  }

  return (
    <div className="fixed bottom-36 right-5 z-[60] sm:bottom-40 sm:right-6">
      {open && (
        <section className="mb-3 flex w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[color:var(--brand-gold)]/45 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.2)]" aria-label="Spicey customer assistant">
          <header className="bg-[color:var(--brand-deep-green)] px-4 py-3 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">Spicey</p>
                <p className="text-xs text-white/75">Your Spice Crowd assistant</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Spicey assistant"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-white/90 transition hover:bg-white/15 hover:text-white"
              >
                ×
              </button>
            </div>
          </header>
          <div className="max-h-80 space-y-3 overflow-y-auto bg-slate-50 p-3" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={message.from === "customer" ? "ml-8 rounded-xl bg-[color:var(--brand-deep-green)] px-3 py-2 text-sm text-white" : "mr-8 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"}>
                {message.text.split(/(\/[A-Za-z0-9_/-]+)/).map((part, index) => part.startsWith("/") ? <Link key={index} className="font-semibold underline" href={part}>{part}</Link> : part)}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Spicey..." aria-label="Ask Spicey" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-deep-green)]" />
            <button type="submit" className="rounded-lg bg-[color:var(--brand-deep-green)] px-3 py-2 text-sm font-semibold text-white">Send</button>
          </form>
        </section>
      )}
    </div>
  );
}
