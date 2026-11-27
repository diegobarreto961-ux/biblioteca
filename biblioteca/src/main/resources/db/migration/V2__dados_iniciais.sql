INSERT INTO livro (isbn, titulo, autor, genero, quantidade_total, quantidade_disponivel)
VALUES
  ('978-85-359-0277-5', 'Dom Casmurro', 'Machado de Assis', 'Romance', 4, 4),
  ('978-85-7657-407-1', 'Duna', 'Frank Herbert', 'Ficção', 3, 3),
  ('978-85-560-8004-3', 'It: A Coisa', 'Stephen King', 'Terror', 2, 2),
  ('978-85-254-3293-0', 'Sapiens', 'Yuval Noah Harari', 'História', 5, 5),
  ('978-85-970-2000-2', 'Metodologia Científica', 'Antonio Carlos Gil', 'Acadêmico', 6, 6),
  ('978-85-254-2000-1', 'Orgulho e Preconceito', 'Jane Austen', 'Romance', 3, 3)
ON CONFLICT (isbn) DO NOTHING;