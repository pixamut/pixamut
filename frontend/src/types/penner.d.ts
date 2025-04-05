declare module 'penner' {
  // Définition des fonctions d'easing
  export function linear(t: number): number;
  export function easeInQuad(t: number): number;
  export function easeOutQuad(t: number): number;
  export function easeInOutQuad(t: number): number;
  export function easeInCubic(t: number): number;
  export function easeOutCubic(t: number): number;
  export function easeInOutCubic(t: number): number;
  export function easeInQuart(t: number): number;
  export function easeOutQuart(t: number): number;
  export function easeInOutQuart(t: number): number;
  export function easeInQuint(t: number): number;
  export function easeOutQuint(t: number): number;
  export function easeInOutQuint(t: number): number;
  export function easeInSine(t: number): number;
  export function easeOutSine(t: number): number;
  export function easeInOutSine(t: number): number;
  export function easeInExpo(t: number): number;
  export function easeOutExpo(t: number): number;
  export function easeInOutExpo(t: number): number;
  export function easeInCirc(t: number): number;
  export function easeOutCirc(t: number): number;
  export function easeInOutCirc(t: number): number;
  export function easeInElastic(t: number): number;
  export function easeOutElastic(t: number): number;
  export function easeInOutElastic(t: number): number;
  export function easeInBack(t: number): number;
  export function easeOutBack(t: number): number;
  export function easeInOutBack(t: number): number;
  export function easeInBounce(t: number): number;
  export function easeOutBounce(t: number): number;
  export function easeInOutBounce(t: number): number;

  // Ajouter une exportation par défaut qui contient toutes les fonctions
  const Penner: {
    linear: typeof linear;
    easeInQuad: typeof easeInQuad;
    easeOutQuad: typeof easeOutQuad;
    easeInOutQuad: typeof easeInOutQuad;
    easeInCubic: typeof easeInCubic;
    easeOutCubic: typeof easeOutCubic;
    easeInOutCubic: typeof easeInOutCubic;
    easeInQuart: typeof easeInQuart;
    easeOutQuart: typeof easeOutQuart;
    easeInOutQuart: typeof easeInOutQuart;
    easeInQuint: typeof easeInQuint;
    easeOutQuint: typeof easeOutQuint;
    easeInOutQuint: typeof easeInOutQuint;
    easeInSine: typeof easeInSine;
    easeOutSine: typeof easeOutSine;
    easeInOutSine: typeof easeInOutSine;
    easeInExpo: typeof easeInExpo;
    easeOutExpo: typeof easeOutExpo;
    easeInOutExpo: typeof easeInOutExpo;
    easeInCirc: typeof easeInCirc;
    easeOutCirc: typeof easeOutCirc;
    easeInOutCirc: typeof easeInOutCirc;
    easeInElastic: typeof easeInElastic;
    easeOutElastic: typeof easeOutElastic;
    easeInOutElastic: typeof easeInOutElastic;
    easeInBack: typeof easeInBack;
    easeOutBack: typeof easeOutBack;
    easeInOutBack: typeof easeInOutBack;
    easeInBounce: typeof easeInBounce;
    easeOutBounce: typeof easeOutBounce;
    easeInOutBounce: typeof easeInOutBounce;
  };

  export default Penner;
} 