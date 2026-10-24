export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
    >
      <path
        d="M20 2.5 37 12.2v15.6L20 37.5 3 27.8V12.2L20 2.5Z"
        fill="#11141a"
        stroke="#f2b34b"
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      <path d="M20 2.5 37 12.2 20 21.9 3 12.2 20 2.5Z" fill="#f5bd5c" />
      <path d="M20 21.9v15.6L3 27.8V12.2l17 9.7Z" fill="#b97c2f" />
      <path d="M20 21.9v15.6l17-9.7V12.2l-17 9.7Z" fill="#d99a3f" />
      <path
        d="M11.5 8.5 20 13.3l8.5-4.8M7.6 10.7 20 17.8l12.4-7.1M7 24.7l8-4.6M25 20.1l8 4.6M20 25.6v7.2"
        stroke="#171a1f"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
    </svg>
  );
}
