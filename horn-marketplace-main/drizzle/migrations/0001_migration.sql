create or replace function public.decrement_stock() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.products set stock = greatest(stock - new.quantity, 0) where id = new.product_id;
  return new;
end; $$;
create trigger order_items_decrement_stock after insert on public.order_items for each row execute function public.decrement_stock();

insert into public.merchants (id, owner_id, shop_name, whatsapp, location) values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','Hargeisa Fresh Market','252634000001','Hargeisa'),
 ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000002','Berbera Port Traders','252634000002','Berbera'),
 ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000003','Burao Livestock & Goods','252634000003','Burao'),
 ('44444444-4444-4444-4444-444444444444','00000000-0000-0000-0000-000000000004','Wajaale Wholesale','252634000004','Tog Wajaale');

insert into public.products (merchant_id, title, description, category, price_usd, price_slsh, stock, photos) values
 ('11111111-1111-1111-1111-111111111111','Cladding Sheet','Exterior aluminium cladding sheets for shops and homes. Sold per sheet.','Home',55,467500,40,array['https://images.pexels.com/photos/9685870/pexels-photo-9685870.jpeg?auto=compress&cs=tinysrgb&w=1200']),
 ('11111111-1111-1111-1111-111111111111','Marble Sheet','Polished marble-look sheet for walls and counters. Bulk orders welcome.','Home',68,578000,24,array['https://images.pexels.com/photos/3847492/pexels-photo-3847492.jpeg?auto=compress&cs=tinysrgb&w=1200']),
 ('22222222-2222-2222-2222-222222222222','Wallpaper','Patterned wallpaper for living rooms and hallways. Sold per roll.','Home',16,136000,90,array['https://images.pexels.com/photos/7546771/pexels-photo-7546771.jpeg?auto=compress&cs=tinysrgb&w=1200']),
 ('22222222-2222-2222-2222-222222222222','Vinyl Sticker Roll','Self-adhesive vinyl sticker roll for signs, vehicles, and decor.','Home',24,204000,70,array['https://images.pexels.com/photos/36697924/pexels-photo-36697924.jpeg?auto=compress&cs=tinysrgb&w=1200']),
 ('33333333-3333-3333-3333-333333333333','Cooking Oil 20L','Vegetable cooking oil jerrycan.','Groceries',30,255000,80,array['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=480&q=60&auto=format']),
 ('33333333-3333-3333-3333-333333333333','Men''s Macawis (Sarong)','Traditional cotton macawis, assorted patterns.','Clothing',12,102000,150,array['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=480&q=60&auto=format']),
 ('44444444-4444-4444-4444-444444444444','Plastic Chairs (Set of 4)','Durable outdoor chairs for homes and restaurants.','Home',35,297500,30,array['https://images.unsplash.com/photo-1503602642458-232111445657?w=480&q=60&auto=format']),
 ('44444444-4444-4444-4444-444444444444','Ethiopian Coffee Beans 5kg','Sidamo green coffee beans, wholesale.','Groceries',48,408000,45,array['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=480&q=60&auto=format']);
