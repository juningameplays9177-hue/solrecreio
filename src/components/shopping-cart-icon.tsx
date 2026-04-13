/** Ícone de carrinho escalável com o texto (use dentro do mesmo `h1` com `h-[1em] w-[1em]`). */
export function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l3.924 12.738a1.125 1.125 0 001.091.807H18.75M2.25 3h16.5M2.25 3l1.68 5.446M9 21.75a.75.75 0 100-1.5.75.75 0 000 1.5zm7.5 0a.75.75 0 100-1.5.75.75 0 000 1.5z"
      />
    </svg>
  );
}
