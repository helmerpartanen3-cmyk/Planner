import { Project } from '../types';

export const projects: Project[] = [
  {
    id: '1',
    slug: 'kalenteri',
    title: 'Kalenteri',
    description: 'Verkko & Työpöytä sovellus',
    fullDescription: 'Interaktiivinen kalenteri ja elämänhallintasovellus. Sovellus on rakennettu Next.js:llä ja on suunniteltu sekä työpöytä että verkko käyttöön.',
    year: '2024',
    role: 'UI/UX Design & Development',
    client: 'Clarity Studios',
    thumbnail: '/assets/clarityImages/clarity-1.png',
    aspectRatio: 'aspect-video',
    gallery: [
      { 
        type: 'image', 
        src: '/assets/clarityImages/clarity-1.png', 
        className: 'col-span-2 aspect-[3/2]',
        caption: 'Kalenterin päänäkymä, jossa voi nädä päivittäiset, viikoittaiset, kuukausittaiset ja vuotuiset tapahtumat selkeästi erottuvina osioina.'
      },
      { 
        type: 'image', 
        src: '/assets/clarityImages/clarity-2.png', 
        className: 'aspect-[4/3]',
        caption: 'Tapahtuman lisäysnäkymä minimalistisella designilla.'
      },
      { 
        type: 'image', 
        src: '/assets/clarityImages/clarity-3.png', 
        className: 'aspect-[4/3]',
        caption: 'Viikkonäkymä yksityiskohtaisen aikataulun kanssa.'
      },
      { 
        type: 'image', 
        src: '/assets/clarityImages/clarity-4.png', 
        className: 'col-span-2 aspect-video',
        caption: 'Mobiilinäkymä optimoituna responsiiville käytölle kaikilla laitteilla.'
      },
    ]
  },
  {
    id: '2',
    slug: 'hiljainen-tila',
    title: 'Hiljainen Tila',
    description: 'Arkkitehtuurikuvaus',
    fullDescription: 'Valokuvasarja, joka tutkii hiljaisuuden ja tyhjän tilan estetiikkaa modernissa suomalaisessa arkkitehtuurissa. Projekti toteutettiin sarjana mustavalkoisia vedoksia.',
    year: '2024',
    role: 'Valokuvaus',
    client: 'Arkkitehtitoimisto Aalto',
    thumbnail: 'https://picsum.photos/600/800',
    aspectRatio: 'aspect-[3/4]',
    gallery: [
      { 
        type: 'image', 
        src: 'https://picsum.photos/1000/1200', 
        className: 'col-span-2 aspect-[3/4]', 
        caption: 'Pääkirjaston aula aamun ensimmäisessä valossa. Varjot luovat rytmin betonipinnoille.' 
      },
      { 
        type: 'image', 
        src: 'https://picsum.photos/800/800', 
        className: 'col-span-1 aspect-square',
        caption: 'Yksityiskohta portaikon kaiteesta. Materiaalina käsittelemätön teräs.'
      },
      { 
        type: 'video', 
        src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 
        className: 'col-span-1 aspect-square',
        caption: 'Valonkierto tilassa päivän aikana.'
      },
    ]
  },
  {
    id: '3',
    slug: 'digitaalinen-virta',
    title: 'Digitaalinen Virta',
    description: 'Verkkosovellus',
    fullDescription: 'Interaktiivinen kokemus, joka visualisoi datavirtoja reaaliajassa. Rakennettu käyttäen uusimpia WebGL-teknologioita.',
    year: '2023',
    role: 'Frontend Development',
    client: 'TechFlow Oy',
    thumbnail: 'https://picsum.photos/800/450',
    aspectRatio: 'aspect-video',
    gallery: [
      { 
        type: 'video', 
        src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 
        className: 'col-span-2 aspect-video',
        caption: 'Aloitusnäkymän partikkelianimaatio reagoi käyttäjän hiiren liikkeisiin.'
      },
      { 
        type: 'image', 
        src: 'https://picsum.photos/800/800', 
        className: 'aspect-square',
        caption: 'Mobiilinäkymä optimoitiin kosketusnäytöille sopivaksi.'
      },
      { 
        type: 'image', 
        src: 'https://picsum.photos/800/800', 
        className: 'aspect-square',
        caption: 'Kojelaudan komponenttikirsjasto.'
      },
    ]
  },
  {
    id: '4',
    slug: 'musta-kahvi',
    title: 'Musta Kahvi',
    description: 'Pakkaussuunnittelu',
    fullDescription: 'Premium-kahvipakkaussarja, joka korostaa tuotteen laatua ja alkuperää typografian ja materiaalien kautta.',
    year: '2022',
    role: 'Graafinen Suunnittelu',
    client: 'Helsinki Roast',
    thumbnail: 'https://picsum.photos/600/600',
    aspectRatio: 'aspect-square',
    gallery: [
      { 
        type: 'image', 
        src: 'https://picsum.photos/1200/800', 
        className: 'col-span-2 aspect-[3/2]',
        caption: 'Koko tuoteperhe ryhmiteltynä.'
      },
      { 
        type: 'image', 
        src: 'https://picsum.photos/600/800', 
        className: 'aspect-[3/4]',
        caption: 'Lähikuva foliopainatuksesta, joka tuo ylellisyyden tuntua.'
      },
      { 
        type: 'image', 
        src: 'https://picsum.photos/600/800', 
        className: 'aspect-[3/4]',
        caption: 'Pussin takaosan infografiikka kertoo kahvin alkuperästä.'
      },
    ]
  },
  {
    id: '5',
    slug: 'urbaani-syke',
    title: 'Urbaani Syke',
    description: 'Videotuotanto',
    fullDescription: 'Lyhytelokuva kaupunkikulttuurista ja sen muutoksesta Helsingin sydämessä.',
    year: '2024',
    role: 'Ohjaus & Leikkaus',
    client: 'Kulttuurirahasto',
    thumbnail: 'https://picsum.photos/400/600',
    aspectRatio: 'aspect-[2/3]',
    gallery: [
      { 
        type: 'video', 
        src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 
        className: 'col-span-2 aspect-video',
        caption: 'Elokuvan loppukohtaus kuvattuna Senaatintorilla auringonnousun aikaan.'
      },
    ]
  }
];