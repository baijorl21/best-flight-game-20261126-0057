// Shared tuning for Sky Courier: Ring Run.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HORIZON_Y = 300;          // screen y of the horizon at level pitch
export const COURSE_LENGTH = 6200;     // metres from start to the runway threshold
export const RUNWAY_Z = 6000;          // runway starts here
export const RUNWAY_HALF_WIDTH = 26;   // metres either side of the centreline
export const RING_RADIUS = 34;         // metres; fly within this of a ring centre
export const MIN_SPEED = 52;           // knots, stall below this
export const MAX_SPEED = 168;          // knots at full throttle
export const CRUISE_SPEED = 104;       // knots the plane settles toward
export const MAX_ALT = 2600;           // feet ceiling for the play area
export const MAX_BANK = 0.95;          // radians of roll either way
export const MAX_PITCH = 0.42;         // radians of climb or dive
export const GROUND_Y = 0;             // feet; touching this ends the flight
export const LAND_MAX_SINK = 260;      // feet per minute allowed at touchdown
export const LAND_MAX_SPEED = 118;     // knots allowed at touchdown
