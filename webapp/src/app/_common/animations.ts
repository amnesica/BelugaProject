import {
  trigger,
  style,
  animate,
  transition,
  query,
  animateChild,
} from '@angular/animations';

export const slideInOutRight = trigger('slideInOutRight', [
  transition(':enter', [
    style({ transform: 'translateX(100%)' }),
    animate('200ms ease-out', style({ transform: 'translateX(0)' })),
  ]),
  transition(':leave', [
    animate('200ms ease-out', style({ transform: 'translateX(100%)' })),
  ]),
]);

export const slideInOutBottom = trigger('slideInOutBottom', [
  transition(':enter', [
    style({ transform: 'translateY(100%)' }),
    animate('200ms ease-out', style({ transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('200ms ease-out', style({ transform: 'translateY(100%)' })),
  ]),
]);

export const dummyParentAnimation = trigger('dummyParentAnimation', [
  transition('* => void', [query('@*', [animateChild()], { optional: true })]),
]);
