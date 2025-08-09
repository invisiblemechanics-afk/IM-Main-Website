import { Slide } from './types';

export const slides: Slide[] = [
  {
    id: 'theory-1',
    type: 'theory',
    title: 'Angular Velocity',
    html: `To find the direction of ω we use the right hand thumb rule. Rotate your fingers in the direction of the angular velocity, the direction in which your thumb points will be the direction of the angular velocity vector.`,
    img: '/assets/omega_direction.png',
  },
  {
    id: 'question-1',
    type: 'mcq-single',
    title: 'Breaking Components',
    question: 'We need to first break ω vector into two different components, one along x-axis and the other along z-axis to make the problem easier. But how exactly do we do it? Given below are two different cases, in case 1 the z-component (Ω) of ω vector is rotating anti-clockwise and in case 2 the z-component (Ω) of ω vector is rotating clockwise. Which case do we consider here?',
    options: ['Case 1', 'Case 2', 'Either', 'None'],
    correct: [0], // Case 1 is correct
    hint: 'Remember the sign convention for Ω about z-axis',
    img: '/assets/cases.png',
  },
  {
    id: 'question-2',
    type: 'numeric',
    title: 'Finding sin & cos',
    question: 'Calculate sinθ and cosθ respectively using the figure given below',
    answer: [0.2, 0.98], // sin θ = 1/5 = 0.2, cos θ = √24/5 ≈ 0.98
    hint: 'Use adjacent upon hypotenuse to get cos θ and use opposite upon hypotenuse to get sin θ',
    img: '/assets/trig_figure.png',
  },
  {
    id: 'question-3',
    type: 'numeric',
    title: 'Component - Angular Momentum',
    question: 'The z-component of angular momentum is given by x/25 · ma² · w, find x',
    answer: 55,
    hint: 'Think about the moment of inertia of the system about the z-axis',
    img: '/assets/angular_momentum.png',
  },
];