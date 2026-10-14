const UINT32_RANGE = 0x1_0000_0000;

export function wheelIndexFromUint32(entryCount: number, randomValue: number) {
  if (!Number.isInteger(entryCount) || entryCount < 1) {
    throw new RangeError("The wheel needs at least one entry");
  }
  if (!Number.isInteger(randomValue) || randomValue < 0 || randomValue >= UINT32_RANGE) {
    throw new RangeError("The random value must be an unsigned 32-bit integer");
  }

  const unbiasedLimit = Math.floor(UINT32_RANGE / entryCount) * entryCount;
  return randomValue < unbiasedLimit ? randomValue % entryCount : null;
}

export function nextWheelRotation(
  currentRotation: number,
  selectedIndex: number,
  entryCount: number,
  fullTurns = 5,
) {
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= entryCount) {
    throw new RangeError("The selected wheel entry is out of range");
  }
  if (!Number.isInteger(fullTurns) || fullTurns < 1) {
    throw new RangeError("The wheel needs at least one full turn");
  }

  const segmentAngle = 360 / entryCount;
  const selectedCenter = (selectedIndex + 0.5) * segmentAngle;
  const targetAngle = (360 - selectedCenter) % 360;
  const currentAngle = ((currentRotation % 360) + 360) % 360;
  const alignmentDelta = (targetAngle - currentAngle + 360) % 360;

  return currentRotation + fullTurns * 360 + alignmentDelta;
}
