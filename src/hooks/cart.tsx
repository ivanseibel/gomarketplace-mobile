import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  const updateStorage = useCallback(async (newProducts: Product[]) => {
    await AsyncStorage.setItem(
      '@GoMarketplace:CartItems',
      JSON.stringify(newProducts),
    );
  }, []);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartItems = await AsyncStorage.getItem('@GoMarketplace:CartItems');

      if (cartItems) {
        setProducts(JSON.parse(cartItems) || ([] as Product[]));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(newProducts);
      updateStorage(newProducts);
    },
    [products, updateStorage],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productIndex = products.findIndex(p => p.id === product.id);

      if (productIndex >= 0) {
        increment(product.id);
        return;
      }

      setProducts([...products, { ...product, quantity: 1 }]);
      updateStorage([...products, { ...product, quantity: 1 }]);
    },
    [increment, products, updateStorage],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? {
              ...product,
              quantity: product.quantity - (product.quantity > 0 ? 1 : 0),
            }
          : product,
      );

      setProducts(newProducts);
      updateStorage(newProducts);
    },
    [products, updateStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
