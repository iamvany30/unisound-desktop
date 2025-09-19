const preloaded = new Set();

export function prefetchComponent(factory) {
  const factoryStr = String(factory);

  if (preloaded.has(factoryStr)) {
    return;
  }

  factory().catch(() => {});
  
  preloaded.add(factoryStr);
  console.log(`[Prefetch] Запрошен бандл для:`, factoryStr);
}


export function preloadAllAppChunks(pageFactories) {
    console.log('%c[Preloader] Начата предварительная загрузка всех бандлов страниц...', 'color: #88B4D3; font-weight: bold;');
    pageFactories.forEach(prefetchComponent);
}