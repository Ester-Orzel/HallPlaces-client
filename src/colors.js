// Every category gets its own color, chosen by its id, so the same category always looks the same.
const PALETTE = ['#e0245e', '#3d5afe', '#00a39a', '#f76707', '#7c3aed', '#2b9348'];

export function colorFor(id) {
  return PALETTE[id % PALETTE.length];
}
