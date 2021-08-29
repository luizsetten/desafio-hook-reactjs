import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const {data} = await api.get(`/products/${productId}`);
      const productInCart = cart.findIndex(prod => prod.id === productId); 

      const {data: {amount}} = await api.get(`/stock/${productId}`)

      if(productInCart !== -1) {
        const newCart = cart.map((prod, index) => {
          if(index === productInCart) {
            if (amount < prod.amount + 1) throw new Error('Insuficient amount');

            return {
              ...prod,
              amount: prod.amount ? prod.amount + 1 : 1
            }
          }
          return prod
        });

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        return;
      }

      setCart([...cart, {...data, amount: 1}]);
    } catch {
      toast.error('Quantidade solicitada fora de estoque');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      setCart([...cart.filter(product => product.id === productId)]);
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
