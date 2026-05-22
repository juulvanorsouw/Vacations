// Vakantiedata — bewerk dit bestand om reizen toe te voegen of bij te werken.
// Laat de regel "window.VACATIONS =" bovenaan en de afsluitende ";" staan.
//
// "country" is een ISO-landcode (bv "NO" voor Noorwegen).
// "route" is optioneel — een lijst van tussenstops; tekent een lijn op de kaart.
//   Vorm: [{ "name": "Plaats", "lat": 0.0, "lon": 0.0 }, ...]
// Tip: zet de beginplaats ook als laatste stop, dan tekent 'ie een rondreis.

window.VACATIONS = {
  "vacations": [
    {
      "id": "dublin-2026",
      "title": "Dublin",
      "location": "Dublin, Ierland",
      "country": "IE",
      "lat": 53.3498,
      "lon": -6.2603,
      "startDate": "2026-04-30",
      "endDate": "2026-05-03",
      "description": "Een lang weekend in Dublin met een rondleiding bij Guinness, lekker uiteten en een paar onverwachte ontmoetingen onderweg.",
      "folder": "pictures/dublin-2026",
      "pictures": ["poort-guinnes.jpg", "schildpad.jpg", "uiteten.jpg"]
    },
    {
      "id": "luxembourg-2026",
      "title": "Luxemburg",
      "location": "Luxemburg Stad, Luxemburg",
      "country": "LU",
      "countries": ["NL", "BE", "FR", "LU"],
      "lat": 49.6117,
      "lon": 6.1319,
      "startDate": "2026-05-13",
      "endDate": "2026-05-17",
      "description": "Een ritje door vier landen: vanuit Oijen via Luik en Hettange-Grande naar Luxemburg Stad, en weer terug. Mooie stadsgezichten, groene dalen en de indrukwekkende staatsbank op de Place de Metz.",
      "folder": "pictures/luxembourg-2026",
      "pictures": ["staatsbank-luxemburg.jpeg"],
      "route": [
        { "name": "Oijen",             "lat": 51.8016, "lon": 5.5458 },
        { "name": "Luik",              "lat": 50.6451, "lon": 5.5734 },
        { "name": "Hettange-Grande",   "lat": 49.4044, "lon": 6.1542 },
        { "name": "Luxemburg Stad",    "lat": 49.6117, "lon": 6.1319 },
        { "name": "Oijen",             "lat": 51.8016, "lon": 5.5458 }
      ]
    },
    {
      "id": "oslo-2026",
      "title": "Oslo (lente)",
      "location": "Oslo, Noorwegen",
      "country": "NO",
      "lat": 59.9139,
      "lon": 10.7522,
      "startDate": "2026-04-21",
      "endDate": "2026-04-28",
      "description": "Een week in Noorwegen met Maartje, kampvuur in de natuur en de stad bij nacht.",
      "folder": "pictures/oslo-2026",
      "pictures": ["kampvuur-maartje.jpeg", "oslo-bij-nacht.jpeg"]
    },
    {
      "id": "porto-2026",
      "title": "Porto",
      "location": "Porto, Portugal",
      "country": "PT",
      "lat": 41.1579,
      "lon": -8.6291,
      "startDate": "2026-01-28",
      "endDate": "2026-02-01",
      "description": "Vier dagen rond Porto met de stad zelf, een dag aan het strand en een uitstap naar Valongo.",
      "folder": "pictures/porto-2026",
      "pictures": ["hike.jpeg", "stadion.jpeg", "uitzicht.jpeg", "zetel.jpeg"],
      "route": [
        { "name": "Porto",              "lat": 41.1579, "lon": -8.6291 },
        { "name": "Strand (Matosinhos)", "lat": 41.1846, "lon": -8.6918 },
        { "name": "Valongo",            "lat": 41.1860, "lon": -8.4961 },
        { "name": "Porto",              "lat": 41.1579, "lon": -8.6291 }
      ]
    },
    {
      "id": "oslo-2025-dec",
      "title": "Oslo (winter)",
      "location": "Oslo, Noorwegen",
      "country": "NO",
      "lat": 59.9180,
      "lon": 10.7600,
      "startDate": "2025-11-30",
      "endDate": "2025-12-05",
      "description": "Oslo in de winter — sneeuw, lichtjes en gezellige cafés om op te warmen.",
      "folder": "pictures/oslo-2025-dec",
      "pictures": ["foto-1.jpeg", "foto-2.jpeg"]
    },
    {
      "id": "milan-2025",
      "title": "Milaan",
      "location": "Milaan, Italië",
      "country": "IT",
      "lat": 45.4642,
      "lon": 9.1900,
      "startDate": "2025-11-21",
      "endDate": "2025-11-25",
      "description": "Een lang weekend in Milaan met de derby in San Siro, de Arco della Pace en een uitstap naar het Comomeer.",
      "folder": "pictures/milan-2025",
      "pictures": ["san-siro-buiten.jpeg", "dumfries-tribune.jpeg", "arco-della-pace.jpeg", "funicolare.jpeg", "comomeer.jpeg"],
      "route": [
        { "name": "Milaan", "lat": 45.4642, "lon": 9.1900 },
        { "name": "Como",   "lat": 45.8081, "lon": 9.0852 },
        { "name": "Milaan", "lat": 45.4642, "lon": 9.1900 }
      ]
    },
    {
      "id": "oslo-2025-okt",
      "title": "Oslo (herfst)",
      "location": "Oslo, Noorwegen",
      "country": "NO",
      "lat": 59.9090,
      "lon": 10.7430,
      "startDate": "2025-10-07",
      "endDate": "2025-10-14",
      "description": "Een herfstweek in Oslo met kleurrijke bossen, frisse ochtenden en lange wandelingen.",
      "folder": "pictures/oslo-2025-okt",
      "pictures": ["foto-1.jpeg", "foto-2.jpeg"]
    },
    {
      "id": "durres-2025",
      "title": "Durrës",
      "location": "Durrës, Albanië",
      "country": "AL",
      "lat": 41.3231,
      "lon": 19.4549,
      "startDate": "2025-08-26",
      "endDate": "2025-08-31",
      "description": "Een week aan de Albanese kust met groepsfoto's, een grot, uitzicht vanaf de bergen en een uitstap naar Tirana.",
      "folder": "pictures/durres-2025",
      "pictures": ["foto berg.jpeg", "groepsfoto.jpeg", "grot.jpeg"],
      "route": [
        { "name": "Durrës", "lat": 41.3231, "lon": 19.4549 },
        { "name": "Tirana", "lat": 41.3275, "lon": 19.8189 },
        { "name": "Durrës", "lat": 41.3231, "lon": 19.4549 }
      ]
    },
    {
      "id": "alsace-2025",
      "title": "Alsace",
      "location": "Alsace, Frankrijk",
      "country": "FR",
      "lat": 48.0794,
      "lon": 7.3585,
      "startDate": "2025-07-31",
      "endDate": "2025-08-07",
      "description": "Een week door de Alsace met Colmar en Sélestat, vakwerkhuisjes en wijngaarden.",
      "folder": "pictures/alsace-2025",
      "pictures": ["bank.jpeg", "hakken.jpeg", "franse-paal.jpeg", "franse-straat.jpeg"],
      "route": [
        { "name": "Colmar",   "lat": 48.0794, "lon": 7.3585 },
        { "name": "Sélestat", "lat": 48.2599, "lon": 7.4540 },
        { "name": "Colmar",   "lat": 48.0794, "lon": 7.3585 }
      ]
    },
    {
      "id": "tivat-2025",
      "title": "Tivat",
      "location": "Tivat, Montenegro",
      "country": "ME",
      "countries": ["ME", "HR", "BA"],
      "lat": 42.4347,
      "lon": 18.7065,
      "startDate": "2025-05-22",
      "endDate": "2025-05-27",
      "description": "Een rondreis door Montenegro en de Balkan met bergwandelingen, de baai van Kotor en turkooizen rivieren.",
      "folder": "pictures/tivat-2025",
      "pictures": [
        "berggeit.jpeg", "uitkijk-graffiti.jpeg", "billboard-kotor.jpeg",
        "stenen-brug.jpeg", "turkoois-rivier.jpeg", "berglandschap.jpeg", "waterval.jpeg"
      ],
      "route": [
        { "name": "Dubrovnik", "lat": 42.6507, "lon": 18.0944 },
        { "name": "Trebinje",  "lat": 42.7115, "lon": 18.3434 },
        { "name": "Žabljak",   "lat": 43.1554, "lon": 19.1228 },
        { "name": "Nikšić",    "lat": 42.7731, "lon": 18.9483 },
        { "name": "Podgorica", "lat": 42.4304, "lon": 19.2594 },
        { "name": "Kotor",     "lat": 42.4247, "lon": 18.7712 },
        { "name": "Tivat",     "lat": 42.4347, "lon": 18.7065 },
        { "name": "Dubrovnik", "lat": 42.6507, "lon": 18.0944 }
      ]
    },
    {
      "id": "budapest-2025",
      "title": "Boedapest",
      "location": "Boedapest, Hongarije",
      "country": "HU",
      "countries": ["HU", "SK"],
      "lat": 47.4979,
      "lon": 19.0402,
      "startDate": "2025-03-03",
      "endDate": "2025-03-09",
      "description": "Een week in Boedapest met daguitstapjes naar Esztergom en het Slowaakse Štúrovo aan de overkant van de Donau.",
      "folder": "pictures/budapest-2025",
      "pictures": ["kabelbaan-burcht.jpeg", "vajdahunyad-kasteel.jpeg", "buda-kasteel-nacht.jpeg", "parlement-donau.jpeg"],
      "route": [
        { "name": "Boedapest", "lat": 47.4979, "lon": 19.0402 },
        { "name": "Esztergom", "lat": 47.7967, "lon": 18.7406 },
        { "name": "Štúrovo",   "lat": 47.7956, "lon": 18.7253 },
        { "name": "Boedapest", "lat": 47.4979, "lon": 19.0402 }
      ]
    },
    {
      "id": "nideggen-2024",
      "title": "Nideggen",
      "location": "Nideggen, Duitsland",
      "country": "DE",
      "lat": 50.6978,
      "lon": 6.4739,
      "startDate": "2024-11-20",
      "endDate": "2024-11-24",
      "description": "Een lang weekend in het Eifelgebied bij het historische stadje Nideggen.",
      "folder": "pictures/nideggen-2024",
      "pictures": ["foto-1.jpeg", "foto-2.jpeg", "foto-3.jpeg", "video-1.mp4"]
    },
    {
      "id": "kos-2024",
      "title": "Kos",
      "location": "Kos, Griekenland",
      "country": "GR",
      "lat": 36.8932,
      "lon": 27.2877,
      "startDate": "2024-07-01",
      "endDate": "2024-07-08",
      "description": "Een week op het Griekse eiland Kos. (Datums zijn een schatting — pas aan in vacations.js zodra je ze weet.)",
      "folder": "pictures/kos-2024",
      "pictures": ["groepsdiner.jpeg"]
    },
    {
      "id": "oslo-2024",
      "title": "Oslo (lang verblijf)",
      "location": "Tverrbakken 4, 0475 Oslo",
      "country": "NO",
      "lat": 59.9441,
      "lon": 10.7476,
      "startDate": "2024-02-01",
      "endDate": "2024-06-28",
      "description": "Saturnveien 8 en Tverrbakken 4, 0475 Oslo.",
      "folder": "pictures/oslo-2024",
      "pictures": ["foto-1.jpeg", "foto-2.jpeg", "foto-3.jpeg", "foto-4.jpeg", "video-1.mp4"]
    },
    {
      "id": "tallinn-2023",
      "title": "Tallinn",
      "location": "Tallinn, Estland",
      "country": "EE",
      "countries": ["EE", "FI"],
      "lat": 59.4370,
      "lon": 24.7536,
      "startDate": "2023-05-20",
      "endDate": "2023-05-27",
      "description": "Een week naar Tallinn met een tussenstop in Helsinki.",
      "folder": "pictures/tallinn-2023",
      "pictures": ["foto-1.jpeg", "foto-2.jpeg", "video-1.mp4"],
      "route": [
        { "name": "Helsinki", "lat": 60.1699, "lon": 24.9384 },
        { "name": "Tallinn",  "lat": 59.4370, "lon": 24.7536 },
        { "name": "Helsinki", "lat": 60.1699, "lon": 24.9384 }
      ]
    }
  ]
};
