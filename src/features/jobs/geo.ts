/** Approximate city centres for the "Odległość od domu" filter (synthetic prototype data, straight-line distance). */
export const cityCoordinates: Record<string, [number, number]> = {
  Gdańsk: [54.352, 18.646],
  Gdynia: [54.518, 18.531],
  Sopot: [54.441, 18.56],
  Warszawa: [52.23, 21.012],
  Kraków: [50.065, 19.945],
  Wrocław: [51.107, 17.038],
  Poznań: [52.406, 16.925],
  Łódź: [51.759, 19.456],
  Katowice: [50.264, 19.024],
  Gliwice: [50.294, 18.668],
  Lublin: [51.246, 22.568],
  Szczecin: [53.428, 14.553],
  Bydgoszcz: [53.123, 18.008],
  Toruń: [53.013, 18.598],
  Białystok: [53.133, 23.164],
  Rzeszów: [50.041, 21.999],
  Kielce: [50.866, 20.628],
  Olsztyn: [53.778, 20.48],
  Opole: [50.675, 17.921],
  Częstochowa: [50.812, 19.12],
  Radom: [51.402, 21.147],
  "Zielona Góra": [51.935, 15.506],
  Piaseczno: [52.081, 21.024],
  Pruszków: [52.17, 20.81],
  Wieliczka: [49.987, 20.065],
  Skierniewice: [51.955, 20.15],
  Pabianice: [51.665, 19.355],
  Oleśnica: [51.209, 17.38],
  Swarzędz: [52.412, 17.08],
  Wejherowo: [54.606, 18.235],
};

export const homeCities = Object.keys(cityCoordinates).sort((a, b) => a.localeCompare(b, "pl"));

function findCity(name: string) {
  const key = name.trim().toLocaleLowerCase("pl");
  const match = homeCities.find((city) => city.toLocaleLowerCase("pl") === key);
  return match ? cityCoordinates[match] : undefined;
}

/** Straight-line distance in km between a known home city and a point, or null when the city is unknown. */
export function distanceKm(home: string, to: { latitude: number; longitude: number } | undefined) {
  const from = findCity(home);
  if (!from || !to) return null;
  const r = Math.PI / 180;
  const dLat = (to.latitude - from[0]) * r;
  const dLon = (to.longitude - from[1]) * r;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(from[0] * r) * Math.cos(to.latitude * r) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}
