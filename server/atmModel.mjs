const trainingData = [
  { distanceKm: 0.6, health: 0.94, demand: 0.35, cashLevel: 85, hour: 9, dayOfWeek: 1, label: 0.92 },
  { distanceKm: 1.1, health: 0.9, demand: 0.4, cashLevel: 78, hour: 10, dayOfWeek: 2, label: 0.86 },
  { distanceKm: 1.8, health: 0.88, demand: 0.52, cashLevel: 74, hour: 12, dayOfWeek: 3, label: 0.8 },
  { distanceKm: 2.3, health: 0.83, demand: 0.7, cashLevel: 68, hour: 15, dayOfWeek: 4, label: 0.71 },
  { distanceKm: 2.7, health: 0.79, demand: 0.76, cashLevel: 63, hour: 17, dayOfWeek: 5, label: 0.64 },
  { distanceKm: 3.1, health: 0.77, demand: 0.8, cashLevel: 58, hour: 18, dayOfWeek: 6, label: 0.58 },
  { distanceKm: 0.9, health: 0.96, demand: 0.48, cashLevel: 88, hour: 8, dayOfWeek: 0, label: 0.9 },
  { distanceKm: 1.5, health: 0.87, demand: 0.62, cashLevel: 70, hour: 14, dayOfWeek: 1, label: 0.72 },
  { distanceKm: 2.2, health: 0.8, demand: 0.88, cashLevel: 57, hour: 20, dayOfWeek: 2, label: 0.5 },
  { distanceKm: 0.4, health: 0.98, demand: 0.28, cashLevel: 91, hour: 7, dayOfWeek: 0, label: 0.96 },
  { distanceKm: 1.9, health: 0.84, demand: 0.57, cashLevel: 66, hour: 11, dayOfWeek: 5, label: 0.69 },
  { distanceKm: 1.3, health: 0.89, demand: 0.44, cashLevel: 80, hour: 13, dayOfWeek: 3, label: 0.83 },
  { distanceKm: 3.4, health: 0.74, demand: 0.91, cashLevel: 49, hour: 19, dayOfWeek: 6, label: 0.42 },
  { distanceKm: 2.8, health: 0.81, demand: 0.67, cashLevel: 62, hour: 16, dayOfWeek: 4, label: 0.61 },
  { distanceKm: 0.7, health: 0.93, demand: 0.39, cashLevel: 84, hour: 10, dayOfWeek: 1, label: 0.88 },
  { distanceKm: 1.2, health: 0.9, demand: 0.45, cashLevel: 77, hour: 12, dayOfWeek: 2, label: 0.79 },
  { distanceKm: 2.6, health: 0.75, demand: 0.85, cashLevel: 54, hour: 18, dayOfWeek: 5, label: 0.52 },
  { distanceKm: 1.6, health: 0.86, demand: 0.55, cashLevel: 71, hour: 9, dayOfWeek: 0, label: 0.75 },
  { distanceKm: 0.8, health: 0.95, demand: 0.33, cashLevel: 89, hour: 11, dayOfWeek: 4, label: 0.94 },
  { distanceKm: 3.0, health: 0.72, demand: 0.98, cashLevel: 47, hour: 21, dayOfWeek: 3, label: 0.38 },
  { distanceKm: 1.4, health: 0.9, demand: 0.5, cashLevel: 73, hour: 15, dayOfWeek: 1, label: 0.76 },
  { distanceKm: 2.1, health: 0.82, demand: 0.63, cashLevel: 60, hour: 17, dayOfWeek: 2, label: 0.66 },
  { distanceKm: 0.5, health: 0.97, demand: 0.29, cashLevel: 90, hour: 8, dayOfWeek: 6, label: 0.95 },
  { distanceKm: 2.5, health: 0.78, demand: 0.82, cashLevel: 56, hour: 20, dayOfWeek: 0, label: 0.46 },
  { distanceKm: 2.9, health: 0.71, demand: 0.96, cashLevel: 44, hour: 22, dayOfWeek: 6, label: 0.34 },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distanceBetween(sample, candidate) {
  const dx = sample.distanceKm - candidate.distanceKm;
  const dy = sample.health - candidate.health;
  const dz = sample.demand - candidate.demand;
  const dw = sample.cashLevel - candidate.cashLevel;
  const dh = sample.hour - candidate.hour;
  const da = sample.dayOfWeek - candidate.dayOfWeek;

  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw / 250 + dh * dh / 36 + da * da / 6);
}

function predictATMScore(sample) {
  const neighbors = trainingData
    .map((row) => ({
      row,
      distance: distanceBetween(sample, row),
    }))
    .sort((first, second) => first.distance - second.distance)
    .slice(0, 3);

  const totalWeight = neighbors.reduce((sum, neighbor) => sum + 1 / (neighbor.distance + 0.0001), 0);
  const score = neighbors.reduce((sum, neighbor) => {
    const weight = 1 / (neighbor.distance + 0.0001);
    return sum + neighbor.row.label * weight;
  }, 0) / totalWeight;

  return clamp(score, 0.18, 0.99);
}

export function buildMLRecommendation({ requestedAmount, customerLimit, hour, dayOfWeek, candidates }) {
  const normalizedLimit = Math.max(customerLimit, 1000);
  const normalizedRequested = Math.max(requestedAmount, 0);

  return candidates
    .map((atm) => {
      const distanceKm = Number(atm.distanceKm ?? 0.8);
      const health = clamp(Number(atm.healthScore ?? 0.8), 0.2, 1);
      const cashLevel = clamp(Number(atm.cashLevel ?? 75), 0, 100);
      const demand = clamp(normalizedRequested / normalizedLimit, 0.2, 1.2);

      const prediction = predictATMScore({
        distanceKm,
        health,
        demand,
        cashLevel,
        hour,
        dayOfWeek,
      });

      const eligible = normalizedRequested <= normalizedLimit && prediction >= 0.62;

      return {
        ...atm,
        predictionScore: Number(prediction.toFixed(3)),
        sufficiencyScore: Number(prediction.toFixed(3)),
        isEligible: eligible,
        recommendation: eligible
          ? "Model predicts this ATM can satisfy the requested withdrawal amount."
          : "Model predicts this ATM is likely to underperform for the requested withdrawal amount.",
      };
    })
    .sort((first, second) => {
      if (Number(first.isEligible) !== Number(second.isEligible)) {
        return Number(second.isEligible) - Number(first.isEligible);
      }
      return second.predictionScore - first.predictionScore;
    });
}

export function buildMLForecast({ hour, dayOfWeek, candidates }) {
  return candidates.map((atm) => {
    const demand = 0.74;
    const prediction = predictATMScore({
      distanceKm: Number(atm.distanceKm ?? 1.2),
      health: clamp(Number(atm.healthScore ?? 0.8), 0.2, 1),
      demand,
      cashLevel: clamp(Number(atm.cashLevel ?? 70), 0, 100),
      hour,
      dayOfWeek,
    });

    return {
      id: atm.id,
      name: atm.name,
      status: prediction >= 0.76 ? "Healthy" : prediction >= 0.62 ? "Refill Soon" : "Critical",
      risk: prediction >= 0.76 ? "low" : prediction >= 0.62 ? "medium" : "high",
      sufficiencyScore: Number(prediction.toFixed(3)),
    };
  });
}

export function predictCashAvailability({ distanceKm, hour, dayOfWeek, atmId, requestedAmount, customerLimit }) {
  const normalizedDistance = clamp(Number(distanceKm ?? 2), 0, 8);
  const peakDemand = hour >= 9 && hour <= 13 ? 13 : hour >= 17 && hour <= 21 ? 18 : 4;
  const weekendDemand = dayOfWeek === 0 || dayOfWeek === 6 ? 7 : 0;
  const terminalSignal = Math.abs(Number(atmId ?? 0)) % 17;
  const estimate = 86 - normalizedDistance * 4.2 - peakDemand - weekendDemand - terminalSignal * 0.35;
  const confidence = clamp(0.58 + (8 - normalizedDistance) * 0.035, 0.58, 0.86);
  const cashPercent = Math.round(clamp(estimate, 18, 96));
  const amountRatio = Number(requestedAmount ?? 0) / Math.max(Number(customerLimit ?? 75000), 1);
  const estimatedCapacity = cashPercent * 1000;
  const likelySufficient = amountRatio <= 1 && estimatedCapacity >= Number(requestedAmount ?? 0);

  return {
    cashPercent,
    estimatedCapacity,
    likelySufficient,
    requestedAmount: Number(requestedAmount ?? 0),
    confidence: Number(confidence.toFixed(2)),
    model: "cash-availability-estimator-v1",
  };
}
