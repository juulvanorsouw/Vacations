// ISO2 <-> numeric country codes, Dutch names and continent groupings for the World view.
// Ported unchanged from the original app.js.

export const ISO2_TO_NUM = {
  "AF":4,"AL":8,"DZ":12,"AD":20,"AO":24,"AG":28,"AR":32,"AM":51,
  "AU":36,"AT":40,"AZ":31,"BS":44,"BH":48,"BD":50,"BB":52,"BY":112,
  "BE":56,"BZ":84,"BJ":204,"BT":64,"BO":68,"BA":70,"BW":72,"BR":76,
  "BN":96,"BG":100,"BF":854,"BI":108,"KH":116,"CM":120,"CA":124,
  "CF":140,"TD":148,"CL":152,"CN":156,"CO":170,"CR":188,"HR":191,
  "CU":192,"CY":196,"CZ":203,"DK":208,"DJ":262,"DO":214,"EC":218,
  "EG":818,"SV":222,"GQ":226,"ER":232,"EE":233,"ET":231,"FJ":242,
  "FI":246,"FR":250,"GA":266,"GM":270,"GE":268,"DE":276,"GH":288,
  "GR":300,"GT":320,"GN":324,"GW":624,"GY":328,"HT":332,"HN":340,
  "HU":348,"IS":352,"IN":356,"ID":360,"IR":364,"IQ":368,"IE":372,
  "IL":376,"IT":380,"JM":388,"JP":392,"JO":400,"KZ":398,"KE":404,
  "KI":296,"KW":414,"KG":417,"LA":418,"LV":428,"LB":422,"LS":426,
  "LR":430,"LY":434,"LI":438,"LT":440,"LU":442,"MG":450,"MW":454,
  "MY":458,"MV":462,"ML":466,"MT":470,"MR":478,"MU":480,"MX":484,
  "MD":498,"MC":492,"MN":496,"ME":499,"MA":504,"MZ":508,"MM":104,
  "NA":516,"NP":524,"NL":528,"NZ":554,"NI":558,"NE":562,"NG":566,
  "MK":807,"NO":578,"OM":512,"PK":586,"PA":591,"PG":598,"PY":600,
  "PE":604,"PH":608,"PL":616,"PT":620,"QA":634,"RO":642,"RU":643,
  "RW":646,"SM":674,"ST":678,"SA":682,"SN":686,"RS":688,"SC":690,
  "SL":694,"SG":702,"SK":703,"SI":705,"SO":706,"ZA":710,"SS":728,
  "ES":724,"LK":144,"SD":729,"SR":740,"SZ":748,"SE":752,"CH":756,
  "SY":760,"TJ":762,"TZ":834,"TH":764,"TG":768,"TO":776,"TT":780,
  "TN":788,"TR":792,"TM":795,"UG":800,"UA":804,"AE":784,"GB":826,
  "US":840,"UY":858,"UZ":860,"VU":548,"VE":862,"VN":704,"YE":887,
  "ZM":894,"ZW":716,"XK":383,"PS":275,"CV":132,"KP":408,"KR":410
};

export const LAND_NAMEN = {
  4:"Afghanistan",8:"Albanië",12:"Algerije",20:"Andorra",24:"Angola",
  32:"Argentinië",36:"Australië",40:"Oostenrijk",50:"Bangladesh",
  56:"België",64:"Bhutan",68:"Bolivia",70:"Bosnië-Herzegovina",
  76:"Brazilië",96:"Brunei",100:"Bulgarije",116:"Cambodja",124:"Canada",
  152:"Chili",156:"China",170:"Colombia",188:"Costa Rica",191:"Kroatië",
  192:"Cuba",196:"Cyprus",203:"Tsjechië",208:"Denemarken",218:"Ecuador",
  818:"Egypte",231:"Ethiopië",246:"Finland",250:"Frankrijk",276:"Duitsland",
  288:"Ghana",300:"Griekenland",320:"Guatemala",332:"Haïti",340:"Honduras",
  348:"Hongarije",352:"IJsland",356:"India",360:"Indonesië",364:"Iran",
  368:"Irak",372:"Ierland",376:"Israël",380:"Italië",392:"Japan",
  400:"Jordanië",404:"Kenia",408:"Noord-Korea",410:"Zuid-Korea",
  414:"Koeweit",428:"Letland",422:"Libanon",434:"Libië",438:"Liechtenstein",
  440:"Litouwen",442:"Luxemburg",450:"Madagaskar",466:"Mali",470:"Malta",
  484:"Mexico",498:"Moldavië",492:"Monaco",496:"Mongolië",499:"Montenegro",
  504:"Marokko",508:"Mozambique",104:"Myanmar",516:"Namibië",524:"Nepal",
  528:"Nederland",554:"Nieuw-Zeeland",562:"Niger",566:"Nigeria",
  807:"Noord-Macedonië",578:"Noorwegen",512:"Oman",586:"Pakistan",
  591:"Panama",598:"Papoea-Nieuw-Guinea",600:"Paraguay",604:"Peru",
  608:"Filipijnen",616:"Polen",620:"Portugal",634:"Qatar",642:"Roemenië",
  643:"Rusland",682:"Saoedi-Arabië",686:"Senegal",688:"Servië",
  694:"Sierra Leone",702:"Singapore",703:"Slowakije",705:"Slovenië",
  706:"Somalië",710:"Zuid-Afrika",728:"Zuid-Soedan",724:"Spanje",
  144:"Sri Lanka",729:"Soedan",740:"Suriname",752:"Zweden",756:"Zwitserland",
  760:"Syrië",762:"Tadzjikistan",834:"Tanzania",764:"Thailand",788:"Tunesië",
  792:"Turkije",800:"Oeganda",804:"Oekraïne",784:"Ver. Arabische Emiraten",
  826:"Verenigd Koninkrijk",840:"Verenigde Staten",858:"Uruguay",
  860:"Oezbekistan",862:"Venezuela",704:"Vietnam",887:"Jemen",894:"Zambia",
  716:"Zimbabwe",383:"Kosovo",275:"Palestina",51:"Armenië",31:"Azerbeidzjan",
  112:"Belarus",204:"Benin",854:"Burkina Faso",140:"Centraal-Afrik. Rep.",
  148:"Tsjaad",262:"Djibouti",214:"Dominicaanse Rep.",222:"El Salvador",
  232:"Eritrea",233:"Estland",242:"Fiji",266:"Gabon",270:"Gambia",
  268:"Georgië",624:"Guinee-Bissau",324:"Guinee",328:"Guyana",296:"Kiribati",
  417:"Kirgizstan",418:"Laos",426:"Lesotho",430:"Liberia",454:"Malawi",
  458:"Maleisië",462:"Malediven",478:"Mauritanië",480:"Mauritius",
  646:"Rwanda",674:"San Marino",678:"São Tomé",690:"Seychellen",
  548:"Vanuatu",776:"Tonga",780:"Trinidad en Tobago",795:"Turkmenistan",
  132:"Kaapverdië",120:"Kameroen",178:"Congo",180:"Congo (DRC)",
  384:"Ivoorkust",226:"Equatoriaal-Guinea"
};

export const CONTINENT_BOUNDS = {
  "Europa":        [[-12,34],[42,72]],
  "Azië":          [[25,-12],[180,78]],
  "Afrika":        [[-20,-36],[55,38]],
  "Noord-Amerika": [[-170,7],[-52,72]],
  "Zuid-Amerika":  [[-82,-56],[-34,13]],
  "Oceanië":       [[110,-48],[180,22]]
};

export const CONTINENT_COUNTRIES = {
  "Europa":        ["AL","AD","AT","BY","BE","BA","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT","XK","LV","LI","LT","LU","MT","MD","MC","ME","NL","MK","NO","PL","PT","RO","RU","SM","RS","SK","SI","ES","SE","CH","UA","GB"],
  "Azië":          ["AF","AM","AZ","BH","BD","BT","BN","KH","CN","GE","IN","ID","IR","IQ","IL","JP","JO","KZ","KW","KG","LA","LB","MY","MV","MN","MM","NP","KP","KR","OM","PK","PS","PH","QA","SA","SG","LK","SY","TJ","TH","TR","TM","AE","UZ","VN","YE"],
  "Afrika":        ["DZ","AO","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CG","CD","CI","DJ","EG","GQ","ER","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW","ML","MR","MU","MA","MZ","NA","NE","NG","RW","ST","SN","SC","SL","SO","ZA","SS","SD","SZ","TZ","TG","TN","UG","ZM","ZW"],
  "Noord-Amerika": ["AG","BS","BB","BZ","CA","CR","CU","DM","DO","SV","GD","GT","HT","HN","JM","MX","NI","PA","KN","LC","VC","TT","US"],
  "Zuid-Amerika":  ["AR","BO","BR","CL","CO","EC","GY","PY","PE","SR","UY","VE"],
  "Oceanië":       ["AU","FJ","KI","MH","FM","NR","NZ","PW","PG","WS","SB","TO","TV","VU"]
};

export const MAINLAND_BOUNDS = {
  250:{minLon:-6,maxLon:13,minLat:41,maxLat:52},
  528:{minLon:2,maxLon:9,minLat:50,maxLat:54},
  208:{minLon:6,maxLon:16,minLat:54,maxLat:58},
  826:{minLon:-10,maxLon:3,minLat:49,maxLat:61},
  724:{minLon:-9,maxLon:5,minLat:35,maxLat:44},
};
