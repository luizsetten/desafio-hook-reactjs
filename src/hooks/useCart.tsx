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
      const {data} = await api.get<Product>(`/products/${productId}`);
      const productInCart = cart.findIndex(prod => prod.id === productId); 

      const {data: {amount}} = await api.get<Stock>(`/stock/${productId}`)

      if (productInCart !== -1 && amount < cart[productInCart].amount + 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productInCart !== -1) {
        const newCart = cart.map((prod, index) => {
          if(index === productInCart) {
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

      const newCart = [...cart, {...data, amount: 1}]
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch (err) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if(cart.findIndex(product => product.id === productId) === -1) throw new Error('Product not found');

      const newCart = cart.filter(product => product.id !== productId);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productInCart = cart.findIndex(prod => prod.id === productId); 

      if(amount < 1) throw new Error(); 

      const {data: {amount: amountAvaliable}} = await api.get<Stock>(`/stock/${productId}`)

      if (amountAvaliable < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productInCart !== -1) {
        const newCart = cart.map((prod, index) => {
          if(index === productInCart) {
            return {
              ...prod,
              amount
            }
          }
          return prod
        });

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        return;
      }

      throw Error();
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
