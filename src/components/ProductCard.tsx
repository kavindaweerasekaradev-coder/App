import type { Product } from '../data/menu'
import { lkr } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { useQuickAdd } from '../state/useQuickAdd'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'

export function TagList({ product }: { product: Product }) {
  return (
    <span className="tags">
      {product.tags.includes('veg') && product.category !== 'drinks' && (
        <span className="tag tag--veg">
          <Icon name="leaf" size={13} /> Veg
        </span>
      )}
      {product.tags.includes('spicy') && (
        <span className="tag tag--spicy">
          <Icon name="flame" size={13} /> Spicy
        </span>
      )}
    </span>
  )
}

export function ProductCard({ product, variant = 'grid' }: { product: Product; variant?: 'grid' | 'feature' }) {
  const { openProduct } = useUi()
  const quickAdd = useQuickAdd()
  const { state } = useStore()
  const inCart = state.cart.filter((i) => i.productId === product.id).reduce((s, i) => s + i.qty, 0)
  const isPizza = product.category === 'pizza'
  const open = () => (isPizza ? openProduct(product.id) : quickAdd(product.id))

  return (
    <article className={`card product-card product-card--${variant}`}>
      {product.badge && (
        <span className={`badge ${product.badge === 'New' ? 'badge--new' : ''}`}>
          <Icon name="sparkle" size={12} /> {product.badge}
        </span>
      )}
      <button type="button" className="product-card__art" onClick={open} tabIndex={-1} aria-hidden="true">
        <FoodPhoto photo={product.photo} width={300} />
      </button>
      <div className="product-card__body">
        <h3 className="product-card__name">
          <button type="button" className="stretched" onClick={open}>
            {product.name}
          </button>
        </h3>
        <p className="product-card__desc">{product.description}</p>
        <TagList product={product} />
        <div className="product-card__foot">
          <div className="price-block">
            {isPizza ? (
              <>
                <span className="price">{lkr(product.prices.personal)}</span>
                <span className="price-sizes">
                  Personal · M {lkr(product.prices.medium).replace('Rs ', '')} · L {lkr(product.prices.large).replace('Rs ', '')}
                </span>
              </>
            ) : (
              <>
                <span className="price">{lkr(product.price)}</span>
                <span className="price-sizes">{product.unit}</span>
              </>
            )}
          </div>
          <button type="button" className="add-btn" onClick={open} aria-label={isPizza ? `Choose size and add ${product.name}` : `Add ${product.name} to cart`}>
            <Icon name="plus" size={20} />
          </button>
        </div>
        {inCart > 0 && (
          <span className="in-cart">
            <Icon name="check" size={13} /> {inCart} in cart
          </span>
        )}
      </div>
    </article>
  )
}
