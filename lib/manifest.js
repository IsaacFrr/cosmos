(function () {
  "use strict";

  window.__COSMOS__ = {
    name: "COSMOS",
    tagline: "Sistema Solar Interactivo",

    planets: [
      {
        name: "Mercury", index: 0, color: "#9c9c9c",
        radius: 0.32, distance: 11, speed: 4.74, tilt: 0.034, selfRotation: 0.004,
        colors: { a: "#9c9c9c", b: "#6b6b6b", c: "#4a4a4a" },
        facts: { radius: "2,439 km", distance: "0.39 AU", period: "88 days / días", temp: "167 °C (avg/media)", moons: "0", mass: "0.055" },
        i18n: {
          en: { name: "Mercury",  tagline: "The smallest and fastest",   desc: "Mercury is the closest planet to the Sun and the smallest in the solar system. Its temperatures range from −180 °C to 430 °C — the most extreme range of any planet." },
          es: { name: "Mercurio", tagline: "El más pequeño y veloz",     desc: "Mercurio es el planeta más cercano al Sol y el más pequeño del sistema solar. Sus temperaturas oscilan entre −180 °C y 430 °C, el rango más extremo de cualquier planeta." }
        }
      },
      {
        name: "Venus", index: 1, color: "#e8d5a3",
        radius: 0.58, distance: 17, speed: 1.85, tilt: 3.09, selfRotation: -0.002,
        colors: { a: "#e8c87a", b: "#c9a44c", c: "#8a6e2a" },
        facts: { radius: "6,051 km", distance: "0.72 AU", period: "225 days / días", temp: "465 °C (avg/media)", moons: "0", mass: "0.815" },
        i18n: {
          en: { name: "Venus", tagline: "The clouded inferno",    desc: "Venus has the densest atmosphere in the solar system, composed mainly of CO₂. Its extreme greenhouse effect makes it the hottest planet, even surpassing Mercury." },
          es: { name: "Venus", tagline: "El infierno nublado",    desc: "Venus tiene la atmósfera más densa del sistema solar, compuesta principalmente de CO₂. Su efecto invernadero extremo lo convierte en el planeta más caliente, incluso superando a Mercurio." }
        }
      },
      {
        name: "Earth", index: 2, color: "#3a88c8",
        radius: 0.62, distance: 24, speed: 1.0, tilt: 0.408, selfRotation: 0.025,
        hasMoon: true,
        colors: { a: "#2a5faa", b: "#2e8b57", c: "#c8d8e8" },
        facts: { radius: "6,371 km", distance: "1.00 AU", period: "365.25 days / días", temp: "15 °C (avg/media)", moons: "1", mass: "1.000" },
        i18n: {
          en: { name: "Earth",  tagline: "Our blue home",       desc: "Earth is the only known planet with life. Its 23.5° axial tilt creates the seasons, and its magnetic field shields us from the solar wind." },
          es: { name: "Tierra", tagline: "Nuestro hogar azul",  desc: "La Tierra es el único planeta conocido con vida. Su eje inclinado 23.5° genera las estaciones, y su campo magnético nos protege del viento solar." }
        }
      },
      {
        name: "Mars", index: 3, color: "#cc4422",
        radius: 0.42, distance: 33, speed: 0.53, tilt: 0.439, selfRotation: 0.024,
        colors: { a: "#cc4422", b: "#8b3010", c: "#5a1a08" },
        facts: { radius: "3,389 km", distance: "1.52 AU", period: "687 days / días", temp: "−63 °C (avg/media)", moons: "2", mass: "0.107" },
        i18n: {
          en: { name: "Mars",  tagline: "The red planet",  desc: "Mars hosts the tallest volcano in the solar system, Olympus Mons (21 km), and the longest canyon, Valles Marineris. Evidence suggests it once had oceans." },
          es: { name: "Marte", tagline: "El planeta rojo", desc: "Marte alberga el volcán más alto del sistema solar, el Olympus Mons (21 km), y el cañón más largo, el Valles Marineris. Evidencias sugieren que tuvo océanos en el pasado." }
        }
      },
      {
        name: "Jupiter", index: 4, color: "#d4a96a",
        radius: 1.75, distance: 50, speed: 0.084, tilt: 0.054, selfRotation: 0.045,
        colors: { a: "#d4a96a", b: "#b8824a", c: "#7a4e28", d: "#e8d0a0" },
        facts: { radius: "69,911 km", distance: "5.20 AU", period: "4,333 days / días", temp: "−108 °C (clouds/nubes)", moons: "95", mass: "317.8" },
        i18n: {
          en: { name: "Jupiter", tagline: "The giant of the system", desc: "Jupiter is so massive it could contain 1,300 Earths. Its Great Red Spot is a storm active for at least 350 years. Its magnetic field is 20,000 times stronger than Earth's." },
          es: { name: "Júpiter", tagline: "El gigante del sistema",  desc: "Júpiter es tan masivo que podría contener 1,300 Tierras. Su Gran Mancha Roja es una tormenta que lleva al menos 350 años activa. Su campo magnético es 20,000 veces más fuerte que el de la Tierra." }
        }
      },
      {
        name: "Saturn", index: 5, color: "#e8d5a3",
        radius: 1.45, distance: 68, speed: 0.034, tilt: 0.466, selfRotation: 0.038,
        hasRings: true,
        colors: { a: "#e8d0a0", b: "#c9a86a", c: "#a88040" },
        facts: { radius: "58,232 km", distance: "9.58 AU", period: "10,759 days / días", temp: "−139 °C (clouds/nubes)", moons: "146", mass: "95.2" },
        i18n: {
          en: { name: "Saturn",  tagline: "The lord of the rings",  desc: "Saturn's rings span 270,000 km in diameter but are only 20 m thick. They are so light that Saturn could float on water. It has the highest moon count in the solar system." },
          es: { name: "Saturno", tagline: "El señor de los anillos", desc: "Los anillos de Saturno tienen 270,000 km de diámetro pero solo 20 m de grosor. Son tan livianos que Saturno podría flotar en el agua. Tiene el mayor número de lunas del sistema solar." }
        }
      },
      {
        name: "Uranus", index: 6, color: "#7de8e8",
        radius: 1.05, distance: 84, speed: 0.012, tilt: 1.706, selfRotation: -0.015,
        colors: { a: "#7de8e8", b: "#55c4c4", c: "#3a9898" },
        facts: { radius: "25,362 km", distance: "19.2 AU", period: "30,687 days / días", temp: "−197 °C (avg/media)", moons: "27", mass: "14.5" },
        i18n: {
          en: { name: "Uranus", tagline: "The tilted planet",    desc: "Uranus orbits almost on its side, with an axis tilted 98°. A catastrophic impact is believed to have toppled it. It is the coldest planet in the solar system at −224 °C." },
          es: { name: "Urano",  tagline: "El planeta volcado",   desc: "Urano orbita casi de lado, con un eje inclinado 98°. Se cree que un impacto catastrófico lo volcó. Es el planeta más frío del sistema solar con −224 °C en su atmósfera." }
        }
      },
      {
        name: "Neptune", index: 7, color: "#3344cc",
        radius: 0.98, distance: 98, speed: 0.006, tilt: 0.494, selfRotation: 0.016,
        colors: { a: "#2233bb", b: "#1a2888", c: "#0e1a5a" },
        facts: { radius: "24,622 km", distance: "30.1 AU", period: "60,190 days / días", temp: "−200 °C (avg/media)", moons: "16", mass: "17.1" },
        i18n: {
          en: { name: "Neptune", tagline: "The icy giant at the edge",    desc: "Neptune has the strongest winds in the solar system, exceeding 2,000 km/h. Its moon Triton orbits in retrograde, suggesting it was captured from the Kuiper Belt." },
          es: { name: "Neptuno", tagline: "El gigante helado del borde",  desc: "Neptuno tiene los vientos más fuertes del sistema solar, superando los 2,000 km/h. Su luna Tritón orbita en sentido retrógrado, lo que sugiere que fue capturada del cinturón de Kuiper." }
        }
      }
    ]
  };
})();
