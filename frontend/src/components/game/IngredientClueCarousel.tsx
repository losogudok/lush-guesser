import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';

import { getIngredientImage } from '../../data/products';
import type { Product } from '../../data/products';

const MAX_INGREDIENT_CLUE_COUNT = 4;
const MIN_CARD_SIZE = 240;
const MAX_CARD_SIZE = 384;
const DRAG_CLICK_TOLERANCE = 6;
const EDGE_RESISTANCE = 0.28;
const FAST_SWIPE_MIN_DISTANCE = 28;
const FAST_SWIPE_VELOCITY = 0.55;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface IngredientClueCarouselProps {
  product: Product;
  revealedCount: number;
  guessed: boolean;
  t: Translate;
  onRevealNext: () => void;
}

export const IngredientClueCarousel: React.FC<IngredientClueCarouselProps> = ({
  product,
  revealedCount,
  guessed,
  t,
  onRevealNext,
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [stageWidth, setStageWidth] = useState(MAX_CARD_SIZE);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragStartedAtRef = useRef(0);
  const suppressNextClickRef = useRef(false);

  const cardSize = clamp(stageWidth * 0.74, MIN_CARD_SIZE, MAX_CARD_SIZE);
  const cardStride = cardSize * 0.82;
  const settleDuration = prefersReducedMotion ? 120 : 260;
  const ingredientClueCount = Math.min(
    product.ingredients.length,
    MAX_INGREDIENT_CLUE_COUNT,
  );
  const allowedMaxCardIndex = guessed
    ? revealedCount - 1
    : Math.min(revealedCount, ingredientClueCount - 1);
  const visibleActiveCardIndex = clamp(activeCardIndex, 0, allowedMaxCardIndex);
  const canSwipePrevious = visibleActiveCardIndex > 0;
  const canSwipeNext = visibleActiveCardIndex < allowedMaxCardIndex;
  const isDragging = dragStartX !== null;
  const resistedDragOffsetX =
    (!canSwipePrevious && dragOffsetX > 0) || (!canSwipeNext && dragOffsetX < 0)
      ? dragOffsetX * EDGE_RESISTANCE
      : dragOffsetX;
  const virtualActiveIndex =
    visibleActiveCardIndex - resistedDragOffsetX / cardStride;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateStageWidth = () => setStageWidth(stage.clientWidth);
    updateStageWidth();

    const resizeObserver = new ResizeObserver(updateStageWidth);
    resizeObserver.observe(stage);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateReducedMotion = () =>
      setPrefersReducedMotion(mediaQuery.matches);

    updateReducedMotion();
    mediaQuery.addEventListener('change', updateReducedMotion);

    return () => mediaQuery.removeEventListener('change', updateReducedMotion);
  }, []);

  const suppressCardClicksDuringSettle = () => {
    suppressNextClickRef.current = true;
    window.setTimeout(() => {
      suppressNextClickRef.current = false;
      setIsSettling(false);
    }, settleDuration);
  };

  const settleToCard = (targetIndex: number) => {
    setActiveCardIndex(clamp(targetIndex, 0, allowedMaxCardIndex));
    setIsSettling(true);
    suppressCardClicksDuringSettle();
  };

  const settleDraggedCard = (offset: number) => {
    const elapsedMs = Math.max(Date.now() - dragStartedAtRef.current, 1);
    const absOffset = Math.abs(offset);
    const swipeThreshold = cardSize * 0.25;
    const isFastSwipe =
      absOffset >= FAST_SWIPE_MIN_DISTANCE &&
      absOffset / elapsedMs >= FAST_SWIPE_VELOCITY;
    const shouldCommit = absOffset >= swipeThreshold || isFastSwipe;

    if (shouldCommit && offset < 0 && canSwipeNext) {
      settleToCard(visibleActiveCardIndex + 1);
    } else if (shouldCommit && offset > 0 && canSwipePrevious) {
      settleToCard(visibleActiveCardIndex - 1);
    } else {
      settleToCard(visibleActiveCardIndex);
    }

    setDragStartX(null);
    setDragOffsetX(0);
    setDragMoved(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || isSettling) return;
    setDragStartX(event.clientX);
    dragStartedAtRef.current = Date.now();
    setDragOffsetX(0);
    setDragMoved(false);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX === null) return;
    const offset = event.clientX - dragStartX;
    if (
      Math.abs(offset) > DRAG_CLICK_TOLERANCE &&
      !event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDragOffsetX(offset);
    setDragMoved(Math.abs(offset) > DRAG_CLICK_TOLERANCE);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX === null) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const offset = event.clientX - dragStartX;
    if (Math.abs(offset) <= DRAG_CLICK_TOLERANCE) {
      setDragStartX(null);
      setDragOffsetX(0);
      setDragMoved(false);
      suppressNextClickRef.current = false;
      return;
    }

    suppressNextClickRef.current = true;
    settleDraggedCard(offset);
  };

  const handleCarouselKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' && canSwipePrevious) {
      event.preventDefault();
      settleToCard(visibleActiveCardIndex - 1);
    } else if (event.key === 'ArrowRight' && canSwipeNext) {
      event.preventDefault();
      settleToCard(visibleActiveCardIndex + 1);
    }
  };

  const handleRevealClick = () => {
    if (!dragMoved && !isSettling && !suppressNextClickRef.current) {
      setActiveCardIndex(Math.min(revealedCount, ingredientClueCount - 1));
      onRevealNext();
    }
  };

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      role="region"
      aria-label="Ingredient clue carousel"
      className="relative mb-12 w-full max-w-4xl py-4 select-none touch-pan-y cursor-grab outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-lush-black focus-visible:ring-offset-4"
      style={{ height: cardSize + 32 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => settleDraggedCard(dragOffsetX)}
      onKeyDown={handleCarouselKeyDown}
    >
      {Array.from({ length: ingredientClueCount }).map((_, index) => {
        const isRevealed = index < revealedCount;
        const isNextToReveal = index === revealedCount;
        const ingredientName = product.ingredients[index];
        const visualPosition = index - virtualActiveIndex;
        const visualDistance = Math.abs(visualPosition);
        const scale = clamp(1 - visualDistance * 0.16, 0.82, 1);
        const opacity =
          visualDistance > 1.35 ? 0 : clamp(1 - visualDistance * 0.35, 0.55, 1);
        const transition = isDragging
          ? 'none'
          : `transform ${settleDuration}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${settleDuration}ms ease`;

        return (
          <CarouselCardFrame
            key={index}
            cardSize={cardSize}
            opacity={opacity}
            zIndex={40 - Math.round(visualDistance * 10)}
            transform={`translateX(calc(-50% + ${
              visualPosition * cardStride
            }px)) scale(${scale})`}
            transition={transition}
          >
            {isRevealed ? (
              <IngredientCard
                index={index}
                ingredientName={ingredientName}
                t={t}
              />
            ) : isNextToReveal && !guessed ? (
              <RevealCard t={t} onReveal={handleRevealClick} />
            ) : (
              <LockedCard label={t('game.locked')} />
            )}
          </CarouselCardFrame>
        );
      })}
    </div>
  );
};

interface CarouselCardFrameProps {
  cardSize: number;
  opacity: number;
  zIndex: number;
  transform: string;
  transition: string;
  children: React.ReactNode;
}

const CarouselCardFrame: React.FC<CarouselCardFrameProps> = ({
  cardSize,
  opacity,
  zIndex,
  transform,
  transition,
  children,
}) => (
  <div
    className="absolute left-1/2 top-4 aspect-square perspective-1000"
    style={{
      width: cardSize,
      opacity,
      zIndex,
      transform,
      transition,
    }}
  >
    {children}
  </div>
);

interface IngredientCardProps {
  index: number;
  ingredientName: string;
  t: Translate;
}

const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredientName,
  t,
}) => (
  <div className="w-full h-full border-2 border-lush-black rounded-xl p-4 bg-lush-gray-bg flex flex-col justify-around shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
    <div className="w-[80%] aspect-square self-center rounded-lg overflow-hidden border border-lush-gray-border bg-white flex items-center justify-center">
      <img
        src={getIngredientImage(ingredientName)}
        alt={ingredientName}
        draggable={false}
        className="w-full h-full object-cover grayscale contrast-[1.1] select-none pointer-events-none"
      />
    </div>
    <div className="flex flex-col text-left">
      {/* <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold leading-tight">
        {t('game.ingredient', { index: index + 1 })}
      </span> */}
      <span className="font-cabinet text-base md:text-lg text-lush-black uppercase leading-tight mt-0.5 truncate">
        {t(ingredientName)}
      </span>
    </div>
  </div>
);

interface RevealCardProps {
  t: Translate;
  onReveal: () => void;
}

const RevealCard: React.FC<RevealCardProps> = ({ t, onReveal }) => (
  <button
    onClick={onReveal}
    className="w-full h-full border-2 border-dashed border-lush-black rounded-xl bg-white hover:bg-neutral-50 flex flex-col items-center justify-center p-5 transition-all duration-200 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
  >
    <div className="bg-neutral-100 p-3 rounded-full mb-4 text-gray-400 border border-lush-gray-border">
      <HelpCircle size={28} strokeWidth={1.5} />
    </div>
    <div className="bg-lush-cyan text-lush-black border border-lush-black text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-md hover:scale-105 active:scale-95 transition-transform">
      {t('game.reveal_next')}
    </div>
    <span className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mt-2">
      {t('game.reveal_cost')}
    </span>
  </button>
);

interface LockedCardProps {
  label: string;
}

const LockedCard: React.FC<LockedCardProps> = ({ label }) => (
  <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-xl bg-white flex flex-col items-center justify-center p-5 text-gray-300">
    <HelpCircle size={32} strokeWidth={1.2} />
    <span className="text-[9px] uppercase tracking-widest font-semibold mt-3">
      {label}
    </span>
  </div>
);
