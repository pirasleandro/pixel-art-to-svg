export default class Point {
  constructor(
    public x: number,
    public y: number
  ) {}

  get up() {
    return new Point(this.x, this.y - 1);
  }

  get right() {
    return new Point(this.x + 1, this.y);
  }

  get down() {
    return new Point(this.x, this.y + 1);
  }

  get left() {
    return new Point(this.x - 1, this.y);
  }

  toString(): string {
    return `${this.x},${this.y}`;
  }
}

export const directions = {
  up: new Point(0, -1),
  right: new Point(1, 0),
  down: new Point(0, 1),
  left: new Point(-1, 0)
};
