# Planner

Yksinkertainen sovellus elämän järjestämiseen. Kalenteri, tehtävät, tavoitteet ja muistiinpanot samassa paikassa. Kaikki tiedot pidetään paikallisesti tietokoneellasi.

## Mitä sillä saa aikaan

- Hallita päivittäisiä tehtäviä ja tavoitteita
- Seurata tottumuksia
- Kirjoittaa muistiinpanoja
- Katsella animoituja sääkuvia
- Käyttää Pomodoro-ajastinta keskittymiseen

## Käyttöönotto

Lataa asennusohjelma [release-sivulta](https://github.com/yourusername/clarity/releases) ja suorita se.

## Kehitys

```bash
npm install
npm run electron:dev
```

Rakenna sovellus:

```bash
npm run electron:build
```

Valmis paketti löytyy `release/`-kansiosta.

## Tekniikka

React + Next.js + Electron. Säätiedot ovat animoitu kuvio, jonka päälle piirtyvät pilvet, tähdet ja salamat.

Tiedot säilötetään lokaalisti AppData-kansioon Windows-koneilla.

