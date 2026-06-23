/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        shopify: '#96bf48',
        woocommerce: '#7f54b3',
        bigcommerce: '#34313f',
      },
    },
  },
  plugins: [],
}
