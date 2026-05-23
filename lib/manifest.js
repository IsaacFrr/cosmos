(function () {
  "use strict";

  window.__COSMOS__ = {
    name: "COSMOS",
    tagline: "Sistema Solar Interactivo",

    planets: [
      {
        name: "Mercury",
        index: 0,
        color: "#9c9c9c",
        radius: 0.32,
        distance: 11,
        speed: 4.74,
        tilt: 0.034,
        selfRotation: 0.004,
        tagline: "El más pequeño y veloz",
        facts: {
          radius: "2,439 km",
          distance: "0.39 AU",
          period: "88 días",
          temp: "167 °C (media)",
          moons: "0",
          mass: "0.055"
        },
        desc: "Mercurio es el planeta más cercano al Sol y el más pequeño del sistema solar. Sus temperaturas oscilan entre −180 °C y 430 °C, el rango más extremo de cualquier planeta.",
        colors: { a: "#9c9c9c", b: "#6b6b6b", c: "#4a4a4a" }
      },
      {
        name: "Venus",
        index: 1,
        color: "#e8d5a3",
        radius: 0.58,
        distance: 17,
        speed: 1.85,
        tilt: 3.09,
        selfRotation: -0.002,
        tagline: "El infierno nublado",
        facts: {
          radius: "6,051 km",
          distance: "0.72 AU",
          period: "225 días",
          temp: "465 °C (media)",
          moons: "0",
          mass: "0.815"
        },
        desc: "Venus tiene la atmósfera más densa del sistema solar, compuesta principalmente de CO₂. Su efecto invernadero extremo lo convierte en el planeta más caliente, incluso superando a Mercurio.",
        colors: { a: "#e8c87a", b: "#c9a44c", c: "#8a6e2a" }
      },
      {
        name: "Earth",
        index: 2,
        color: "#3a88c8",
        radius: 0.62,
        distance: 24,
        speed: 1.0,
        tilt: 0.408,
        selfRotation: 0.025,
        tagline: "Nuestro hogar azul",
        hasMoon: true,
        facts: {
          radius: "6,371 km",
          distance: "1.00 AU",
          period: "365.25 días",
          temp: "15 °C (media)",
          moons: "1",
          mass: "1.000"
        },
        desc: "La Tierra es el único planeta conocido con vida. Su eje inclinado 23.5° genera las estaciones, y su campo magnético nos protege del viento solar.",
        colors: { a: "#2a5faa", b: "#2e8b57", c: "#c8d8e8" }
      },
      {
        name: "Mars",
        index: 3,
        color: "#cc4422",
        radius: 0.42,
        distance: 33,
        speed: 0.53,
        tilt: 0.439,
        selfRotation: 0.024,
        tagline: "El planeta rojo",
        facts: {
          radius: "3,389 km",
          distance: "1.52 AU",
          period: "687 días",
          temp: "−63 °C (media)",
          moons: "2",
          mass: "0.107"
        },
        desc: "Marte alberga el volcán más alto del sistema solar, el Olympus Mons (21 km), y el cañón más largo, el Valles Marineris. Evidencias sugieren que tuvo océanos en el pasado.",
        colors: { a: "#cc4422", b: "#8b3010", c: "#5a1a08" }
      },
      {
        name: "Jupiter",
        index: 4,
        color: "#d4a96a",
        radius: 1.75,
        distance: 50,
        speed: 0.084,
        tilt: 0.054,
        selfRotation: 0.045,
        tagline: "El gigante del sistema",
        facts: {
          radius: "69,911 km",
          distance: "5.20 AU",
          period: "4,333 días",
          temp: "−108 °C (nubes)",
          moons: "95",
          mass: "317.8"
        },
        desc: "Júpiter es tan masivo que podría contener 1,300 Tierras. Su Gran Mancha Roja es una tormenta que lleva al menos 350 años activa. Su campo magnético es 20,000 veces más fuerte que el de la Tierra.",
        colors: { a: "#d4a96a", b: "#b8824a", c: "#7a4e28", d: "#e8d0a0" }
      },
      {
        name: "Saturn",
        index: 5,
        color: "#e8d5a3",
        radius: 1.45,
        distance: 68,
        speed: 0.034,
        tilt: 0.466,
        selfRotation: 0.038,
        tagline: "El señor de los anillos",
        hasRings: true,
        facts: {
          radius: "58,232 km",
          distance: "9.58 AU",
          period: "10,759 días",
          temp: "−139 °C (nubes)",
          moons: "146",
          mass: "95.2"
        },
        desc: "Los anillos de Saturno tienen 270,000 km de diámetro pero solo 20 m de grosor. Son tan livianos que Saturno podría flotar en el agua. Tiene el mayor número de lunas del sistema solar.",
        colors: { a: "#e8d0a0", b: "#c9a86a", c: "#a88040" }
      },
      {
        name: "Uranus",
        index: 6,
        color: "#7de8e8",
        radius: 1.05,
        distance: 84,
        speed: 0.012,
        tilt: 1.706,
        selfRotation: -0.015,
        tagline: "El planeta volcado",
        facts: {
          radius: "25,362 km",
          distance: "19.2 AU",
          period: "30,687 días",
          temp: "−197 °C (media)",
          moons: "27",
          mass: "14.5"
        },
        desc: "Urano orbita casi de lado, con un eje inclinado 98°. Se cree que un impacto catastrófico lo volcó. Es el planeta más frío del sistema solar con −224 °C en su atmósfera.",
        colors: { a: "#7de8e8", b: "#55c4c4", c: "#3a9898" }
      },
      {
        name: "Neptune",
        index: 7,
        color: "#3344cc",
        radius: 0.98,
        distance: 98,
        speed: 0.006,
        tilt: 0.494,
        selfRotation: 0.016,
        tagline: "El gigante helado del borde",
        facts: {
          radius: "24,622 km",
          distance: "30.1 AU",
          period: "60,190 días",
          temp: "−200 °C (media)",
          moons: "16",
          mass: "17.1"
        },
        desc: "Neptuno tiene los vientos más fuertes del sistema solar, superando los 2,000 km/h. Su luna Tritón orbita en sentido retrógrado, lo que sugiere que fue capturada del cinturón de Kuiper.",
        colors: { a: "#2233bb", b: "#1a2888", c: "#0e1a5a" }
      }
    ]
  };
})();
