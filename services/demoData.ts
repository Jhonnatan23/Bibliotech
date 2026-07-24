import { Book, BookStatus, BookType } from '../types';

export const DEMO_BOOKS: Book[] = [
  {
    id: "demo-book-1",
    user_id: "demo-user",
    title: "Dom Casmurro",
    author: "Machado de Assis",
    pages: 256,
    genre: "Clássico",
    type: BookType.Book,
    status: BookStatus.Read,
    rating: 10,
    summary: "Uma das obras-primas da literatura brasileira. O romance narra a história de Bento Santiago (Bentinho), que suspeita que sua esposa Capitu o traiu com seu melhor amigo, Escobar.",
    notes: "Leitura incrível. A ambiguidade sobre a traição é o que torna o livro eterno.",
    dateAdded: "2026-01-10",
    dateStarted: "2026-01-12",
    dateFinished: "2026-01-20",
    daysToFinish: 8,
    timesRead: 1,
    wasWishlist: false,
    tags: ["Literatura Brasileira", "Favoritos"]
  },
  {
    id: "demo-book-2",
    user_id: "demo-user",
    title: "1984",
    author: "George Orwell",
    pages: 336,
    genre: "Ficção",
    type: BookType.Book,
    status: BookStatus.Reading,
    currentPage: 150,
    summary: "Uma das mais influentes distopias do século XX. Retrata um estado totalitário sob a vigilância constante do Grande Irmão (Big Brother).",
    notes: "Assustadoramente atual. Winston é um personagem cativante e trágico.",
    dateAdded: "2026-02-01",
    dateStarted: "2026-02-05",
    tags: ["Distopia", "Político"]
  },
  {
    id: "demo-book-3",
    user_id: "demo-user",
    title: "O Senhor dos Anéis: A Sociedade do Anel",
    author: "J.R.R. Tolkien",
    pages: 576,
    genre: "Fantasia",
    type: BookType.Book,
    status: BookStatus.TBR,
    summary: "O primeiro volume da grande saga de fantasia épica de J.R.R. Tolkien, narrando o início da jornada do Frodo para destruir o Um Anel.",
    dateAdded: "2026-02-15",
    tags: ["Fantasia Épica", "Tolkien"]
  }
];
