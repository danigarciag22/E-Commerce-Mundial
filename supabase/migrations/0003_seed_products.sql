insert into products (name, sku, price, description, category) values
  ('Camiseta Selección Colombia 2026 Local', 'UNI-COL-001', 349900, 'Camiseta oficial local, tecnología Dri-FIT.', 'uniforme'),
  ('Camiseta Argentina Visitante 2026', 'UNI-ARG-001', 339900, 'Edición mundialista visitante.', 'uniforme'),
  ('Botines Nike Mercurial Vapor 16', 'ZAP-NIK-001', 899900, 'Botines de césped firme, ligeros.', 'zapato'),
  ('Botines Adidas Predator Elite', 'ZAP-ADI-001', 949900, 'Control y precisión en cada toque.', 'zapato'),
  ('Balón Oficial Mundial 2026', 'BAL-FIFA-001', 219900, 'Balón térmico oficial del torneo.', 'balon'),
  ('Balón Champions League Pro', 'BAL-UCL-001', 189900, 'Réplica profesional.', 'balon'),
  ('Bufanda Selección Colombia', 'MER-COL-001', 59900, 'Bufanda tejida de hincha.', 'merchandising'),
  ('Gorra Mundial 2026', 'MER-FIFA-001', 79900, 'Gorra ajustable edición mundial.', 'merchandising'),
  ('Camiseta Brasil Local 2026', 'UNI-BRA-001', 339900, 'Amarillo icónico.', 'uniforme'),
  ('Botines Puma Future 8', 'ZAP-PUM-001', 829900, 'Ajuste adaptativo.', 'zapato'),
  ('Balón Entrenamiento Pro', 'BAL-TRN-001', 99900, 'Resistente, para entrenar.', 'balon'),
  ('Termo Hincha Mundial', 'MER-TRM-001', 69900, 'Acero inoxidable 750ml.', 'merchandising')
on conflict (sku) do nothing;

insert into product_3d (product_id, model_url, background_url, lighting_preset)
select id, null, null, 'stadium' from products
on conflict (product_id) do nothing;
