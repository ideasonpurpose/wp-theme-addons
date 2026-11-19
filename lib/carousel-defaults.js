/**
 * Shared by the editor controls and the front-end module.
 * PHP does not repeat these: it only prints attributes an author has set,
 * and the front end applies these when the attribute is absent.
 */
export const CAROUSEL_DEFAULTS = {
  autoplay: true,
  duration: 6,
  arrows: true,
  dots: true,
  pause: false,
  loop: true,
  random: 0,
};
